import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 가로 스크롤 요소에 드래그 스크롤 기능을 추가하는 composable
 * @param {Object} options - 옵션 객체
 * @param {string} options.buttonSelector - 버튼 클릭을 감지할 선택자 (선택사항, 예: '.category-btn')
 * @returns {Object} - 드래그 스크롤 관련 함수와 상태
 */
export function useDragScroll(options = {}) {
    const { buttonSelector = null } = options;
    
    const scrollRef = ref(null);
    const isDragging = ref(false);
    const startX = ref(0);
    const scrollLeft = ref(0);
    const hasMoved = ref(false);
    const isMouseDown = ref(false);
    const isButtonClick = ref(false);

    // 드래그 시작
    const handleMouseDown = (e) => {
        if (!scrollRef.value) return;
        
        // 버튼 위에서 시작했는지 확인 (buttonSelector가 제공된 경우)
        if (buttonSelector) {
            isButtonClick.value = e.target.closest(buttonSelector) !== null;
        }
        hasMoved.value = false;
        isMouseDown.value = true;
        
        const rect = scrollRef.value.getBoundingClientRect();
        startX.value = e.pageX - rect.left;
        scrollLeft.value = scrollRef.value.scrollLeft;
    };

    // 드래그 종료 공통 함수
    const stopDragging = () => {
        if (!scrollRef.value) return;
        isDragging.value = false;
        hasMoved.value = false;
        isButtonClick.value = false;
        isMouseDown.value = false;
        scrollRef.value.style.cursor = 'grab';
        scrollRef.value.style.userSelect = '';
    };

    // 전역 마우스 이벤트 리스너 (드래그 종료용)
    const handleGlobalMouseUp = () => {
        if (isMouseDown.value || isDragging.value) {
            stopDragging();
        }
    };

    // 전역 마우스 이동 이벤트 (드래그 중 스크롤)
    const handleGlobalMouseMove = (e) => {
        if (!scrollRef.value || !isMouseDown.value) return;
        
        // 마우스가 움직였는지 확인 (5px 이상 움직여야 드래그로 간주)
        if (!hasMoved.value) {
            const rect = scrollRef.value.getBoundingClientRect();
            const currentX = e.pageX - rect.left;
            const moveDistance = Math.abs(currentX - startX.value);
            
            if (moveDistance < 5) {
                return; // 작은 움직임은 무시 (클릭으로 간주)
            }
            
            // 드래그 시작
            hasMoved.value = true;
            isDragging.value = true;
            scrollRef.value.style.cursor = 'grabbing';
            scrollRef.value.style.userSelect = 'none';
        }
        
        if (isDragging.value) {
            e.preventDefault();
            const rect = scrollRef.value.getBoundingClientRect();
            const x = e.pageX - rect.left;
            const walk = (x - startX.value) * 2; // 스크롤 속도 조절
            scrollRef.value.scrollLeft = scrollLeft.value - walk;
        }
    };

    onMounted(() => {
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('mousemove', handleGlobalMouseMove);
    });

    onUnmounted(() => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('mousemove', handleGlobalMouseMove);
    });

    return {
        scrollRef,
        handleMouseDown
    };
}

