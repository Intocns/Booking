import { api } from "@/api/axios";

export const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await api.post('/api/add/img', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        const { imageUrl } = JSON.parse(response.data.data);

        // 성공 시 URL 반환
        return imageUrl;
    } catch (error) {
        throw new Error(error.response?.data?.message || '이미지 업로드 중 오류가 발생했습니다.');
    }
}