<template>
    <div class="p-4">
        <div class="mb-4">
            <h2 class="text-xl font-semibold mb-2">AI全网搜书</h2>
            <div class="flex flex-col sm:flex-row gap-2">
                <input 
                    type="text" 
                    v-model="searchTitle" 
                    placeholder="输入书名"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @keyup.enter="searchBooks" />
                <input 
                    type="text" 
                    v-model="searchAuthor" 
                    placeholder="输入作者"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @keyup.enter="searchBooks" />
                <button 
                    @click="searchBooks" 
                    class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                    <i class="fa fa-search mr-1"></i> 搜索
                </button>
            </div>
        </div>
        
        <div v-if="loading" class="py-8 flex justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        
        <div v-else-if="searchResults && searchResults.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
                v-for="(result, index) in searchResults" 
                :key="index" 
                class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                <div class="flex p-3 gap-3">
                    <div class="flex-shrink-0">
                        <img 
                            :src="result.coverUrl || '/static/default-cover.png'" 
                            alt="书籍封面" 
                            class="w-24 h-36 object-cover rounded-md shadow-sm">
                    </div>
                    
                    <div class="flex-grow flex flex-col">
                        <div>
                            <h3 class="font-semibold text-gray-900">{{ result.title }}</h3>
                            <p class="text-sm text-gray-600 mt-1">
                                <span class="mr-2"><i class="fa fa-user mr-1"></i>{{ result.author || '未知' }}</span>
                                <span><i class="fa fa-folder mr-1"></i>{{ result.category || '未分类' }}</span>
                            </p>
                            
                            <div v-if="result.inShelf" class="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <i class="fa fa-check-circle mr-1 text-green-500"></i> 已在书架
                            </div>
                            
                            <p class="text-sm text-gray-600 mt-2 line-clamp-3">
                                {{ result.intro || '暂无简介' }}
                            </p>
                        </div>
                        
                        <div class="mt-3 flex gap-2">
                            <button 
                                @click="startReading(result)"
                                class="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm">
                                <i class="fa fa-book mr-1"></i> {{ result.inShelf ? '继续阅读' : '加入并阅读' }}
                            </button>
                            
                            <button 
                                v-if="!result.inShelf" 
                                @click="addToShelf(result)"
                                class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm">
                                <i class="fa fa-plus mr-1"></i> 加入书架
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div v-else class="py-8 text-center text-gray-500">
            <i class="fa fa-book-open text-4xl mb-3 opacity-30"></i>
            <p>没有找到相关书籍</p>
        </div>
    </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import aiIntegration from '../plugins/ai-integration.js';
import { showNotification } from '../utils/notification';
import { useRouter } from 'vue-router';

export default {
    name: 'AISearchResult',
    setup() {
        const router = useRouter();
        
        const searchTitle = ref('');
        const searchAuthor = ref('');
        const searchResults = ref([]);
        const loading = ref(false);
        
        // 搜索书籍
        const searchBooks = async () => {
            if (!searchTitle.value) {
                showNotification('请输入书名', 'warning');
                return;
            }
            
            try {
                loading.value = true;
                
                // 执行全网搜索
                const results = await aiIntegration.searchWholeNetworkBooks(
                    searchTitle.value, 
                    searchAuthor.value
                );
                
                // 检查书籍是否已在书架中
                const checkInShelfPromises = results.map(async (result) => {
                    const inShelf = await aiIntegration.isBookInShelf(result.title, result.author);
                    return { ...result, inShelf };
                });
                
                searchResults.value = await Promise.all(checkInShelfPromises);
                loading.value = false;
            } catch (error) {
                loading.value = false;
                console.error('全网搜书失败:', error);
                showNotification(`搜索失败: ${error.message}`, 'error');
            }
        };
        
        // 加入书架
        const addToShelf = async (result) => {
            try {
                // 添加书源
                const sourceId = await aiIntegration.addSourceFromSearchResult(result);
                
                // 添加书籍到书架
                const bookId = await aiIntegration.addBookFromSearchResult(result, sourceId);
                
                // 更新搜索结果中的状态
                const index = searchResults.value.findIndex(r => r.title === result.title);
                if (index !== -1) {
                    searchResults.value[index].inShelf = true;
                    searchResults.value[index].bookId = bookId;
                }
                
                showNotification(`《${result.title}》已加入书架`, 'success');
            } catch (error) {
                console.error('添加到书架失败:', error);
                showNotification(`添加到书架失败: ${error.message}`, 'error');
            }
        };
        
        // 开始阅读
        const startReading = async (result) => {
            try {
                if (result.inShelf && result.bookId) {
                    // 直接打开已有书籍
                    router.push({
                        name: 'Reading',
                        params: { bookId: result.bookId }
                    });
                } else {
                    // 添加新书后打开
                    const bookId = await addToShelf(result);
                    
                    if (bookId) {
                        router.push({
                            name: 'Reading',
                            params: { bookId }
                        });
                    }
                }
            } catch (error) {
                console.error('开始阅读失败:', error);
                showNotification(`开始阅读失败: ${error.message}`, 'error');
            }
        };
        
        return {
            searchTitle,
            searchAuthor,
            searchResults,
            loading,
            searchBooks,
            addToShelf,
            startReading
        };
    }
}
</script>

<style scoped>
/* Tailwind CSS 已全局引入，此处仅添加自定义样式 */
</style>