# AI를 위한 Motion 라이브러리 활용 지침서

이 문서는 banjjack_ppt01 프로젝트에서 모션(Motion, 구 Framer Motion) 라이브러리를 효과적으로 활용하여 화려하고 세련된 애니메이션을 구현하기 위한 AI 및 개발자용 지침서입니다.

## 1. 개요 및 패키지 식별 규칙

Motion 라이브러리는 기존의 framer-motion에서 최신 버전(v12 이상)을 기점으로 motion으로 통합 개편되었습니다.

- 공식 패키지 명칭: motion
- React 19 호환 임포트 경로: import { motion, AnimatePresence } from 'motion/react'
- 주의 사항: 이전 프로젝트나 템플릿 코드에서 import { motion } from 'framer-motion'으로 작성된 코드가 보인다면, 반드시 'motion/react' 경로로 수정하여 호환성 에러를 방지해야 합니다.

## 2. 핵심 컴포넌트 및 기본 사용 문법

### 2.1 motion 컴포넌트
기본 HTML 엘리먼트 앞에 'motion.'을 붙여 사용합니다. (예: motion.div, motion.span, motion.h1)
이 컴포넌트들은 애니메이션을 제어할 수 있는 특수한 속성들을 제공합니다.

- initial: 컴포넌트가 처음 화면에 나타날 때의 시작 스타일 상태
- animate: 컴포넌트가 활성화되었을 때 도달할 최종 스타일 상태
- exit: 컴포넌트가 화면에서 사라질(언마운트) 때 거칠 소멸 스타일 상태
- transition: 애니메이션의 속도, 가속도 곡선, 지연 시간, 스프링 설정 등을 세부 튜닝하는 속성

사용 예시:
```jsx
import { motion } from 'motion/react';

function SimpleAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      기본 애니메이션 div
    </motion.div>
  );
}
```

### 2.2 AnimatePresence 컴포넌트
React 컴포넌트가 조건부 렌더링에 의해 마운트되거나 언마운트될 때, exit 애니메이션이 정상적으로 끝난 뒤 엘리먼트가 제거되도록 보장하는 감싸개 컴포넌트입니다.

- 슬라이드 전환, 모달 팝업의 등장과 소멸 등에 필수적으로 사용됩니다.
- direct child 컴포넌트에는 고유한 key 속성이 부여되어야 정상 작동합니다.

사용 예시:
```jsx
import { motion, AnimatePresence } from 'motion/react';

function ToggleBox({ isVisible }) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="box"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          사라질 때도 부드럽게 연출되는 컴포넌트
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## 3. variants를 활용한 컴포넌트 연출 패턴

애니메이션 상태 객체(variants)를 컴포넌트 외부에 정의해 두고, 이를 참조하는 방식입니다. 코드 가독성을 획기적으로 개선하며 복잡한 계층 구조에서 자식 컴포넌트들의 시간차 애니메이션(stagger)을 일괄 제어할 수 있습니다.

### 3.1 시간차 등장(Stagger) 구현 규칙
부모 컴포넌트의 variants에 staggerChildren 지연 시간을 지정하고, 자식 컴포넌트에 동일한 variant 상태 이름들을 연결하면, 자식 요소들이 순차적으로 아래에서 위로 부드럽게 노출되는 연출을 구현할 수 있습니다.

설계 패턴:
```jsx
// 1. 애니메이션 설정 정의
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // 자식 컴포넌트 간의 등장 지연 간격 (초 단위)
      delayChildren: 0.1     // 전체 시작 전 지연 시간
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      stiffness: 100, 
      damping: 15 
    } 
  }
};

// 2. 컴포넌트 렌더링에 매핑
function CardList({ items }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {items.map((item, index) => (
        <motion.div key={index} variants={itemVariants} className="card">
          {item.name}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

## 4. banjjack_ppt01 프로젝트에 적용된 실제 모션 설계 사례

현재 프로젝트의 src/App.jsx 파일에 구현되어 작동 중인 실전 아키텍처 패턴입니다. 차후 슬라이드 추가 및 미니게임 상세 화면 개편 시 이 패턴을 그대로 계승해야 합니다.

### 4.1 슬라이드 좌우 트랜지션 (spring 모델 적용)
사용자가 이전/다음 버튼 또는 키보드 방향키를 누를 때, 슬라이드 진행 방향에 맞춰 화면이 들어오고 나가는 모션입니다.
- App.jsx 코드 정의부:
```javascript
const slideTransitionVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.4 }
    }
  },
  exit: (direction) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.3 }
    }
  })
};
```
- 적용 방법:
AnimatePresence 컴포넌트의 custom 속성에 현재 진행 방향(direction: 1 또는 -1)을 바인딩하고, 자식 motion.div에 key={currentSlide} 및 custom={direction}을 설정하여 실시간 방향 연동 슬라이딩을 구현했습니다.

### 4.2 React 상태 렌더링 무한 루프 방지 패턴
이벤트 리스너(hashchange 등)가 리액트 상태(currentSlide)를 계속해서 감시하고 변경할 때, 불필요한 리렌더링 루프를 방지하기 위한 구조 설계가 포함되어 있습니다.
- 해결 방안: useRef 훅으로 실시간 슬라이드 상태를 가리키는 레퍼런스(currentSlideRef)를 선언하여 이벤트 리스너 내부에서 상태 변경 유무를 조건문으로 선제 판단하도록 격리했습니다.

## 5. 추가적인 PPT 모션 고도화 및 튜닝 가이드

앞으로 웹 PPT 화면을 추가하거나 업그레이드할 때 활용할 수 있는 고급 모션 제어 기법들입니다.

### 5.1 스프링(Spring) 애니메이션 미세 조정
스프링 타입의 애니메이션은 실제 물리 법칙을 흉내 내므로 자연스러운 반동 효과를 연출할 수 있습니다.
- stiffness (탄성 강도): 높을수록 더 단단하고 빠르게 반응합니다. (기본값: 100)
- damping (마찰 저항): 낮을수록 반동 흔들림이 오래 지속되고, 높을수록 반동이 억제되며 조용히 멈춥니다. (기본값: 10)
- mass (무게): 무게가 클수록 가속 및 감속에 큰 힘이 들어가며 묵직하게 움직입니다.

### 5.2 제스처 및 호버 애니메이션
목차 아이템이나 카드 링크 요소에 마우스가 호버되거나 클릭될 때 반응하는 인터랙티브 모션입니다.
- whileHover: 호버 시 변화할 스타일 지정 (예: whileHover={{ scale: 1.05, borderColor: '#ffffff' }})
- whileTap: 클릭 누르고 있을 때의 스타일 지정 (예: whileTap={{ scale: 0.95 }})

### 5.3 추가 리소스 안내
더 복잡한 기획안이나 예제를 확인할 때는 아래 링크를 참고하여 소스코드를 모방 적용할 수 있습니다.
- Motion 공식 문서: https://motion.dev/docs/react
- 330개 이상의 복사해서 붙여넣기 가능한 오피셜 예제: https://motion.dev/examples