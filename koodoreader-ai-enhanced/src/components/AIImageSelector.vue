<template>
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" v-if="visible">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div class="p-4 border-b flex justify-between items-center">
                <h3 class="text-lg font-semibold">AI配图选择器</h3>
                <button @click="close" class="text-gray-500 hover:text-gray-700">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            
            <div class="p-4 flex-grow overflow-y-auto">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">提示词</label>
                    <textarea 
                        v-model="prompt" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3" 
                        placeholder="描述你想要的封面风格和元素..."></textarea>
                </div>
                
                <div class="flex gap-2 mb-4">
                    <button 
                        @click="generateImages" 
                        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                        <i class="fa fa-refresh mr-1"></i> 重新生成
                    </button>
                    
                    <button 
                        @click="useDefaultPrompt" 
                        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                        使用默认提示词
                    </button>
                </div>
                
                <div v-if="loading" class="flex justify-center py-10">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
                
                <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <div 
                        v-for="(image, index) in generatedImages" 
                        :key="index" 
                        class="relative group cursor-pointer"
                        @click="selectImage(image)">
                        <img 
                            :src="image.url" 
                            alt="AI生成封面" 
                            class="w-full h-48 object-cover rounded-md border-2 border-transparent transition-all duration-300 
                                  group-hover:shadow-lg group-hover:scale-[1.02] 
                                  :class='selectedImage === image ? "border-blue-500 ring-2 ring-blue-500" : ""'">
                        <div class="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span class="text-white">点击选择</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="p-4 border-t flex justify-end gap-2">
                <button 
                    @click="close" 
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                    取消
                </button>
                
                <button 
                    @click="confirmSelection" 
                    :disabled="!selectedImage"
                    class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors 
                          opacity-70 disabled:cursor-not-allowed disabled:opacity-50">
                    应用选择
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, defineComponent, watch } from 'vue';
import aiIntegration from '../plugins/ai-integration.js';
import { showNotification } from '../utils/notification';

export default defineComponent({
    props: {
        book: {
            type: Object,
            required: true
        },
        visible: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'image-selected'],
    setup(props, { emit }) {
        const prompt = ref('');
        const generatedImages = ref([]);
        const selectedImage = ref(null);
        const loading = ref(false);
        
        // 生成默认提示词
        const generateDefaultPrompt = () => {
            return `为书籍《${props.book.title}》（作者：${props.book.author || '未知'}）生成一个高质量封面图片。` +
                   `书籍简介：${props.book.intro || '暂无简介'}。要求风格：现代简约，适合阅读类应用。`;
        };
        
        // 使用默认提示词
        const useDefaultPrompt = () => {
            prompt.value = generateDefaultPrompt();
        };
        
        // 生成图片
        const generateImages = async () => {
            if (!prompt.value.trim()) {
                showNotification('请输入提示词', 'warning');
                return;
            }
            
            try {
                loading.value = true;
                generatedImages.value = [];
                selectedImage.value = null;
                
                // 调用AI生成图片
                const images = await aiIntegration.generateBookCovers(prompt.value);
                
                generatedImages.value = images.map((url, index) => ({
                    id: index,
                    url
                }));
                
                loading.value = false;
            } catch (error) {
                loading.value = false;
                console.error('生成图片失败:', error);
                showNotification(`生成图片失败: ${error.message}`, 'error');
            }
        };
        
        // 选择图片
        const selectImage = (image) => {
            selectedImage.value = image;
        };
        
        // 确认选择
        const confirmSelection = () => {
            if (selectedImage.value) {
                emit('image-selected', selectedImage.value.url);
                emit('close');
            } else {
                showNotification('请先选择一张图片', 'warning');
            }
        };
        
        // 关闭选择器
        const close = () => {
            emit('close');
        };
        
        // 监听visible属性变化
        watch(() => props.visible, (newVal) => {
            if (newVal) {
                // 打开时初始化
                prompt.value = generateDefaultPrompt();
                generatedImages.value = [];
                selectedImage.value = null;
                generateImages();
            }
        });
        
        return {
            prompt,
            generatedImages,
            selectedImage,
            loading,
            useDefaultPrompt,
            generateImages,
            selectImage,
            confirmSelection,
            close
        };
    }
});
</script>

<style scoped>
/* Tailwind CSS 已全局引入，此处仅添加自定义样式 */
</style>    