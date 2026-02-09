import { api } from "@/api/axios";
import { showAlert } from "./ui";

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await api.post('/api/add/img', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        const { imageUrl } = JSON.parse(response.data.data);
        // 성공 시 URL 반환
        return imageUrl;
    } catch {
        showAlert('사진 등록에 실패했습니다.\n등록 가능한 파일 형식과 용량을 확인해 주세요.\n\n· 최대 30장 등록 가능\n· 한 장당 최대 20MB, 1200 × 750 권장\n· JPG, GIF, PNG, BMP, HEIF 형식의 사진 등록 가능')
    }
    
}