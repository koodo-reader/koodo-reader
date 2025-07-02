<template>
    <div class="p-4">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div class="flex flex-col md:flex-row gap-4">
                <div class="flex-shrink-0">
                    <div class="relative">
                        <img 
                            :src="book.coverUrl || '/static/default-cover.png'" 
                            alt="书籍封面" 
                            class="w-40 h-56 object-cover rounded-md shadow-md">
                        <button 
                            @click="openAIImageSelector" 
                            class="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors">
                            <i class="fa fa-paint-brush"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex-grow">
                    <h1 class="text-xl font-bold text-gray-900 mb-2">{{ book.title }}</h1>
                    
                    <div class="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div class="flex items-center">
                            <i class="fa fa-user text-gray-400 w-5"></i>
                            <span class="text-gray-600">作者: {{ book.author || '未知' }}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fa fa-folder text-gray-400 w-5"></i>
                            <span class="text-gray-600">分类: {{ book.category || '未分类' }}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fa fa-clock-o text-gray-400 w-5"></i>
                            <span class="text-gray-600">更新: {{ formatDate(book.updatedAt) || '未知' }}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fa fa-book text-gray-400 w-5"></i>
                            <span class="text-gray-600">章节: {{ book.chapterCount || '未知' }}</span>
                        </div>
                    </div>
                    
                    <div v-if="book.hasUpdate" class="mb-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <i class="fa fa-bell mr-1 text-red-500"></i>
                        有 {{ book.updateInfo?.count || '新' }} 章节更新
                    </div>
                    
                    <div class="mb-3">
                        <p class="text-gray-700 leading-relaxed">{{ book.intro || '暂无简介' }}</p>
                    </div>
                    
                    <div class="flex flex-wrap gap-2">
                        <button 
                            @click="startReading" 
                            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center">
                            <i class="fa fa-book mr-1"></i> 开始阅读
                        </button>
                        
                        <button 
                            @click="updateBook" 
                            class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center">
                            <i class="fa fa-refresh mr-1"></i> 更新书籍
                        </button>
                        
                        <button 
                            @click="purifyBook" 
                            class="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center">
                            <i class="fa fa-broom mr-1"></i> 内容净化
                        </button>
                        
                        <button 
                            @click="proofreadBook" 
                            class="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center">
                            <i class="fa fa-check-circle mr-1"></i> AI校对
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
            <div class="p-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold">章节列表</h2>
            </div>
            
            <div class="p-2">
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <div 
                        v-for="(chapter, index) in chapters" 
                        :key="index" 
                        class="px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                        :class="{
                            'bg-blue-50': currentChapter && currentChapter.id === chapter.id,
                            'text-blue-600': currentChapter && currentChapter.id === chapter.id,
                            'font-medium': currentChapter && currentChapter.id === chapter.id
                        }"
                        @click="readChapter(chapter)">
                        {{ chapter.title }}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold">AI推荐书源</h2>
            </div>
            
            <AISearchResult :searchTitle="book.title" :searchAuthor="book.author" />
        </div>
        
        <AIImageSelector 
            :book="book" 
            :visible="showAIImageSelector" 
            @close="showAIImageSelector = false"
            @image-selected="applySelectedImage" />
    </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { db } from '../db';
import aiIntegration from '../plugins/ai-integration.js';
import { showNotification } from '../utils/notification';
import { formatDate } from '../utils/date';
import AISearchResult from './AISearchResult.vue';
import AIImageSelector from './AIImageSelector.vue';
import { useRouter } from 'vue-router';

export default {
    name: 'BookDetail',
    components: {
        AISearchResult,
        AIImageSelector
    },
    setup(props) {
        const router = useRouter();
        
        const bookId = props.bookId;
        const book = ref({});
        const chapters = ref([]);
        const currentChapter = ref(null);
        const showAIImageSelector = ref(false);
        
        // 加载书籍信息
        const loadBook = async () => {
            const loadedBook = await db.books.get(bookId);
            if (loadedBook) {
                book.value = loadedBook;
                
                // 加载章节列表
                if (loadedBook.chapters) {
                    chapters.value = loadedBook.chapters;
                    
                    // 获取当前阅读章节
                    if (loadedBook.currentChapterId) {
                        currentChapter.value = loadedBook.chapters.find(
                            ch => ch.id === loadedBook.currentChapterId
                        );
                    }
                }
            }
        };
        
        // 开始阅读
        const startReading = () => {
            router.push({
                name: 'Reading',
                params: { bookId }
            });
        };
        
        // 阅读指定章节
        const readChapter = (chapter) => {
            router.push({
                name: 'Reading',
                params: { 
                    bookId,
                    chapterId: chapter.id || chapter.href
                }
            });
        };
        
        // 更新书籍
        const updateBook = async () => {
            try {
                showNotification('正在更新书籍...', 'loading');
                
                // 调用更新管理器
                const result = await aiIntegration.updateBook(bookId);
                
                if (result.success) {
                    // 重新加载书籍信息
                    await loadBook();
                    showNotification(`"${book.value.title}" 已更新到最新章节`, 'success');
                } else {
                    showNotification('更新失败: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('更新书籍失败:', error);
                showNotification('更新书籍失败: ' + error.message, 'error');
            }
        };
        
        // 书籍净化
        const purifyBook = async () => {
            try {
                showNotification('正在净化书籍内容...', 'loading');
                
                // 调用AI服务净化书籍
                const result = await aiIntegration.purifyBook(bookId);
                
                if (result.success) {
                    // 重新加载书籍信息
                    await loadBook();
                    showNotification(`"${book.value.title}" 内容已净化`, 'success');
                } else {
                    showNotification('净化失败: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('书籍净化失败:', error);
                showNotification('书籍净化失败: ' + error.message, 'error');
            }
        };
        
        // AI校对书籍
        const proofreadBook = async () => {
            try {
                showNotification('正在校对书籍内容...', 'loading');
                
                // 调用AI服务校对书籍
                const result = await aiIntegration.proofreadBook(bookId);
                
                if (result.success) {
                    // 重新加载书籍信息
                    await loadBook();
                    showNotification(`"${book.value.title}" 校对完成，修复 ${result.fixedIssues} 个问题`, 'success');
                } else {
                    showNotification('校对失败: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('AI校对失败:', error);
                showNotification('AI校对失败: ' + error.message, 'error');
            }
        };
        
        // 打开AI配图选择器
        const openAIImageSelector = () => {
            showAIImageSelector.value = true;
        };
        
        // 应用选择的图片
        const applySelectedImage = async (imageUrl) => {
            try {
                // 更新书籍封面
                await db.books.update(bookId, {
                    coverUrl: imageUrl,
                    updatedAt: new Date()
                });
                
                // 重新加载书籍信息
                await loadBook();
                
                showNotification('书籍封面已更新', 'success');
            } catch (error) {
                console.error('更新封面失败:', error);
                showNotification('更新封面失败: ' + error.message, 'error');
            }
        };
        
        onMounted(() => {
            loadBook();
        });
        
        return {
            bookId,
            book,
            chapters,
            currentChapter,
            formatDate,
            startReading,
            readChapter,
            updateBook,
            purifyBook,
            proofreadBook,
            showAIImageSelector,
            openAIImageSelector,
            applySelectedImage
        };
    },
    props: {
        bookId: {
            type: Number,
            required: true
        }
    }
}
</script>

<style scoped>
/* Tailwind CSS 已全局引入，此处仅添加自定义样式 */
</style>