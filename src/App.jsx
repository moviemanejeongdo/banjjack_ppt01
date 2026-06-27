import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// 슬라이드 전환 애니메이션 효과 (좌우 슬라이딩 + 페이드)
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

// 카드들이 순차적으로 나타나는 스태거(Stagger) 애니메이션 효과
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
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

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentStageGroup, setCurrentStageGroup] = useState(0);
  const [direction, setDirection] = useState(0); // 슬라이드 이동 방향 (1: 다음, -1: 이전)
  
  const totalSlides = 7;
  
  // 무한 루프 방지를 위해 실시간 currentSlide 값을 가리키는 Ref 사용
  const currentSlideRef = useRef(currentSlide);
  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);

  // 슬라이드 및 캐러셀 스텝 이동 제어 함수 (Ref를 사용하여 의존성 제거)
  const goToSlide = useCallback((index) => {
    if (index < 0 || index >= totalSlides) return;
    setDirection(index > currentSlideRef.current ? 1 : -1);
    setCurrentSlide(index);
    if (index === 6) {
      setCurrentStageGroup(0);
    }
  }, []);

  const nextSlide = useCallback(() => {
    // 8대 공정 슬라이드(인덱스 6)인 경우 내부 캐러셀 먼저 순회
    if (currentSlideRef.current === 6 && currentStageGroup < 2) {
      setCurrentStageGroup((prev) => prev + 1);
    } else if (currentSlideRef.current < totalSlides - 1) {
      goToSlide(currentSlideRef.current + 1);
    }
  }, [currentStageGroup, goToSlide]);

  const prevSlide = useCallback(() => {
    // 8대 공정 슬라이드(인덱스 6)인 경우 내부 캐러셀 먼저 역순 순회
    if (currentSlideRef.current === 6 && currentStageGroup > 0) {
      setCurrentStageGroup((prev) => prev - 1);
    } else if (currentSlideRef.current > 0) {
      goToSlide(currentSlideRef.current - 1);
    }
  }, [currentStageGroup, goToSlide]);

  // 키보드 조작 이벤트 리스너 등록
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault(); // 스페이스바 화면 스크롤 방지
        nextSlide();
      } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        nextSlide();
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextSlide, prevSlide]);

  // 화면 클릭 시 다음 슬라이드로 이동 (인터랙티브 요소 클릭 시 전환 방지)
  const handlePageClick = (e) => {
    if (
      e.target.closest('.index-item') || 
      e.target.closest('.header-logo') || 
      e.target.closest('button') ||
      e.target.closest('.controls-footer')
    ) {
      return;
    }
    nextSlide();
  };

  // 해시 체인지 핸들러로 URL 해시와 동기화
  // 초기 로드 시 해시 체크
  useEffect(() => {
    const initialHash = window.location.hash;
    if (initialHash.startsWith('#slide-')) {
      const index = parseInt(initialHash.replace('#slide-', ''), 10) - 1;
      if (!isNaN(index) && index >= 0 && index < totalSlides) {
        setCurrentSlide(index);
      }
    }
  }, []);

  // 해시 체인지 핸들러로 URL 해시와 동기화
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#slide-')) {
        const index = parseInt(hash.replace('#slide-', ''), 10) - 1;
        if (!isNaN(index) && index >= 0 && index < totalSlides && index !== currentSlideRef.current) {
          goToSlide(index);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [goToSlide]);

  // 해시 업데이트
  useEffect(() => {
    window.location.hash = `slide-${currentSlide + 1}`;
  }, [currentSlide]);

  // 슬라이드 진행률 텍스트 반환
  const getProgressText = () => {
    if (currentSlide === 6) {
      return `SLIDE 7 / 7 (스텝 ${currentStageGroup + 1}/3)`;
    }
    return `SLIDE ${currentSlide + 1} / ${totalSlides}`;
  };

  // 8대 공정 타이틀 반환
  const getStageTitleText = () => {
    if (currentStageGroup === 0) {
      return '5. 8대 공정 미니게임 (1/3: 1~4공정) // 8-STAGE PROCESS';
    } else if (currentStageGroup === 1) {
      return '5. 8대 공정 미니게임 (2/3: 4~8공정) // 8-STAGE PROCESS';
    }
    return '5. 8대 공정 미니게임 (3/3: 개발 대상 1, 7공정) // 8-STAGE PROCESS';
  };

  return (
    <div onClick={handlePageClick} style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* M Tricolor Stripe */}
      <div className="m-stripe">
        <div className="blue-light"></div>
        <div className="blue-dark"></div>
        <div className="red"></div>
      </div>

      {/* Header */}
      <header>
        <div className="header-logo" onClick={() => goToSlide(0)}>
          ORBIT <span>//</span> BANJJAK SEMICON MAKER
        </div>
        <div className="header-nav" id="slide-progress">
          {getProgressText()}
        </div>
      </header>

      {/* Presentation Container */}
      <div className="presentation-container">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideTransitionVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="slide active"
          >
            {/* Slide 0: Cover */}
            {currentSlide === 0 && (
              <>
                <div></div>
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, type: 'spring' }}
                  style={{ maxWidth: '900px', margin: 'auto 0' }}
                >
                  <div className="display-xl">반짝반짝<br />반도체 메이커</div>
                  <div className="body-light" style={{ fontSize: '18px', letterSpacing: '4px', fontWeight: 400, textTransform: 'uppercase', color: 'var(--color-body-strong)' }}>
                    Team Orbit
                  </div>
                </motion.div>
                <div></div>
              </>
            )}

            {/* Slide 1: Index */}
            {currentSlide === 1 && (
              <>
                <div className="display-lg">목록 // INDEX</div>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="index-container"
                >
                  {[
                    { num: '01', text: '1. 기획의도', target: 2 },
                    { num: '02', text: '2. 타겟유저 & 개념풀이', target: 3 },
                    { num: '03', text: '3. 게임 시나리오', target: 4 },
                    { num: '04', text: '4. 로비 마을', target: 5 },
                    { num: '05', text: '5. 8대 공정 미니게임', target: 6 }
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      variants={itemVariants}
                      className="index-item" 
                      onClick={() => goToSlide(item.target)}
                    >
                      <span><span className="index-num">{item.num}</span>{item.text}</span>
                      <span className="index-arrow">→</span>
                    </motion.div>
                  ))}
                </motion.div>
                <div></div>
              </>
            )}

            {/* Slide 2: 기획의도 */}
            {currentSlide === 2 && (
              <>
                <div className="display-lg">1. 기획의도 // INTRODUCTION</div>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid-2"
                >
                  <motion.div variants={itemVariants} className="card-m">
                    <div className="display-md">반도체 계약학과의 인기 상승</div>
                    <p className="body-light" style={{ marginTop: '16px' }}>
                      최근 대학 입시에서 반도체 계약학과의 선호도가 급증하여, <span className="body-strong">의과대학과 나란히 경쟁하며 한의대 및 약대를 앞지르는 현상</span>이 발생하고 있습니다.<br /><br />
                      이에 따라 어린이와 청소년 시기부터 반도체의 개념과 공정 원리를 직관적이고 재미있게 학습할 수 있는 실감형 교육 콘텐츠의 필요성이 대두되었습니다.
                    </p>
                  </motion.div>
                  <motion.div variants={itemVariants} className="media-container" style={{ height: '100%' }}>
                    <img src="./기획발표자료/고등학생 6월모의고사 반도체 계약학과 의대와 나란히하며 한의대 약대 앞질러.png" alt="반도체 계약학과 인기 뉴스 그래프" />
                  </motion.div>
                </motion.div>
                <div></div>
              </>
            )}

            {/* Slide 3: 타겟유저 & 개념풀이 */}
            {currentSlide === 3 && (
              <>
                <div className="display-lg">2. 타겟유저 & 개념풀이 // TARGET & CONCEPT</div>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid-2"
                >
                  <motion.div variants={itemVariants} className="card-m" style={{ padding: '24px' }}>
                    <div className="display-md" style={{ fontSize: '54px', marginBottom: '16px' }}>타겟 유저</div>
                    <p className="body-light" style={{ marginBottom: '32px', lineHeight: '1.3' }}>
                      <span className="body-strong" style={{ fontSize: '54px', color: 'var(--color-primary)', lineHeight: '1.2' }}>초·중·고 학생 및 학부모</span>
                    </p>
                    
                    <div className="display-md" style={{ fontSize: '54px', marginTop: '24px', marginBottom: '16px' }}>어려운 반도체 용어</div>
                    <div className="def-box" style={{ marginTop: '12px', paddingLeft: '24px' }}>
                      <p className="body-light" style={{ fontSize: '48px', fontStyle: 'italic', lineHeight: '1.4' }}>
                        "반도체란 전기 전도도가 금속과 절연체 중간 정도이고, 일반 금속과 달리 온도 증가에 따라 저항이 감소되는 온도 영역이 존재하는 재료를 총괄하여 말함."
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="card-m" style={{ backgroundColor: 'var(--color-surface-soft)', padding: '24px' }}>
                    <div className="display-md" style={{ color: 'var(--m-blue-light)', fontSize: '54px', marginBottom: '24px' }}>초등학생 눈높이 풀이</div>
                    <p className="body-light" style={{ fontSize: '38px', lineHeight: 1.5, marginBottom: '32px' }}>
                      <span className="body-strong" style={{ color: 'var(--color-primary)', fontSize: '42px', fontWeight: 700 }}>1. 반(Half)만 도체! "마법의 변신 물질"</span><br />
                      평소에는 전기가 안 통하게 문을 꽁꽁 닫고 있다가, 스위치를 켜면 문이 활짝 열려 전기가 쌩쌩 통하게 되는 똑똑한 재료예요.
                    </p>
                    <p className="body-light" style={{ fontSize: '38px', lineHeight: 1.5 }}>
                      <span className="body-strong" style={{ color: 'var(--color-primary)', fontSize: '42px', fontWeight: 700 }}>2. 따뜻해질수록 힘이 솟는 "전하 요정들"</span><br />
                      일반 쇠붙이는 뜨거워지면 전기를 방해하지만, 반도체는 따뜻해질수록 에너지를 얻은 전하 요정들이 더 신나게 쌩쌩 달릴 수 있게 길을 활짝 열어줘요.
                    </p>
                  </motion.div>
                </motion.div>
                <div></div>
              </>
            )}

            {/* Slide 4: 게임 시나리오 */}
            {currentSlide === 4 && (
              <>
                <div className="display-lg">3. 게임 시나리오 // SCENARIO</div>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid-2"
                >
                  <motion.div variants={itemVariants} className="card-m">
                    <div className="display-md">더스트론의 침공과 마을의 오염</div>
                    <p className="body-light" style={{ marginTop: '16px' }}>
                      평화롭던 반도체 마을에 파티클 괴물 <span className="body-strong" style={{ color: 'var(--m-red)' }}>‘더스트론’</span>이 등장하여 마을의 신호등과 가로등, 기기들이 모두 먹통이 되었습니다.<br /><br />
                      플레이어는 마을 구석구석을 탐험하며 오염을 퍼뜨리는 파티클 괴물을 정화하고, 반도체 8대 공정 미니게임을 해결하여 반짝반짝 칩을 완성하고 마을의 생기를 되살려야 합니다.
                    </p>
                  </motion.div>
                  <motion.div variants={itemVariants} className="media-container">
                    <img src="./기획발표자료/파티클괴물.png" alt="파티클 괴물 콘셉트 이미지" />
                  </motion.div>
                </motion.div>
                <div></div>
              </>
            )}

            {/* Slide 5: 로비 마을 */}
            {currentSlide === 5 && (
              <>
                <div className="display-lg">4. 로비 마을 // LOBBY VILLAGE</div>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid-3"
                >
                  <motion.div variants={itemVariants} className="card-m">
                    <div className="display-md">공정 체험형 가상 공간</div>
                    <p className="body-light" style={{ marginTop: '16px' }}>
                      플레이어는 로비 맵을 자유롭게 이동하며 다른 플레이어와 대화하고 ai npc 에게 반도체에 대한 정보를 얻음<br /><br />
                      마을의 천장에는 실제 반도체 공장 설비인 <span className="body-strong">OHT(Overhead Hoist Transport) 레일</span>이 흐르고 있으며, 플레이어는 OHT 에 매달려 이동 가능
                    </p>
                  </motion.div>
                  <motion.div variants={itemVariants} className="media-container">
                    <img src="./기획발표자료/로비마을.png" alt="로비 맵 공간 이미지" />
                  </motion.div>
                  <motion.div variants={itemVariants} className="media-container">
                    <img src="./기획발표자료/로비마을.gif" alt="로비 마을 OHT 이동 액션" />
                  </motion.div>
                </motion.div>
                <div></div>
              </>
            )}

            {/* Slide 6: 8대 공정 미니게임 (내부 캐러셀 포함) */}
            {currentSlide === 6 && (
              <>
                <div className="display-lg">{getStageTitleText()}</div>
                
                <div style={{ width: '100%', position: 'relative' }}>
                  <AnimatePresence mode="wait">
                    {/* 8대 공정 1단계: 1~4 공정 */}
                    {currentStageGroup === 0 && (
                      <motion.div 
                        key="group-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="stages-grid active"
                        style={{ display: 'grid' }}
                      >
                        {[
                          { num: 'STAGE 01', title: '웨이퍼 제조', desc: '모래 정원에서 실리콘 조각을 모으고 원통형 잉곳을 슬라이싱하기' },
                          { num: 'STAGE 02', title: '산화 공정', desc: '가스 챔버의 레버를 조작해 깨끗하고 빈틈없는 보호막 입히기' },
                          { num: 'STAGE 03', title: '포토 공정', desc: '렌즈 배율을 조정하고 미세한 자외선 노광 레이저로 회로 새기기' },
                          { num: 'STAGE 04', title: '식각 공정', desc: '화학 건을 사용해 회로 패턴을 제외한 불필요한 영역만 깎아내기' }
                        ].map((stage, idx) => (
                          <div key={idx} className="stage-card">
                            <div className="stage-num">{stage.num}</div>
                            <div className="stage-title">{stage.title}</div>
                            <div className="stage-desc">{stage.desc}</div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* 8대 공정 2단계: 4~8 공정 */}
                    {currentStageGroup === 1 && (
                      <motion.div 
                        key="group-1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="stages-grid active"
                        id="stage-group-2"
                        style={{ display: 'grid' }}
                      >
                        {[
                          { num: 'STAGE 04', title: '식각 공정', desc: '화학 건을 사용해 회로 패턴을 제외한 불필요한 영역만 깎아내기' },
                          { num: 'STAGE 05', title: '박막 증착', desc: '원자층 두께의 얇은 막을 균일하고 평평하게 연속으로 쌓아 올리기' },
                          { num: 'STAGE 06', title: '이온 주입', desc: '전하 요정 빔을 쏘아 부도체 실리콘에 특별한 전기 성질 주입하기' },
                          { num: 'STAGE 07', title: '금속 배선', desc: '수로 파이프를 회전하고 이어 붙여 전류 요정들의 수로 연결하기' },
                          { num: 'STAGE 08', title: '테스트 & 패킹', desc: '전류 테스트로 수율을 판정하고 케이스에 안전하게 패키징해 밀봉하기' }
                        ].map((stage, idx) => (
                          <div key={idx} className="stage-card">
                            <div className="stage-num">{stage.num}</div>
                            <div className="stage-title">{stage.title}</div>
                            <div className="stage-desc">{stage.desc}</div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* 8대 공정 3단계: 이번 개발 대상 */}
                    {currentStageGroup === 2 && (
                      <motion.div 
                        key="group-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="stages-grid active"
                        id="stage-group-3"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}
                      >
                        <div className="stage-card" style={{ borderColor: 'var(--m-blue-light)', boxShadow: '0 0 20px rgba(28, 105, 212, 0.4)' }}>
                          <div className="stage-num" style={{ color: 'var(--m-red)' }}>★ 이번 개발 대상 (01)</div>
                          <div className="stage-title">웨이퍼 제조</div>
                          <div className="stage-desc">모래 정원에서 실리콘 조각을 모으고 원통형 잉곳을 슬라이싱하기</div>
                        </div>
                        <div className="stage-card" style={{ borderColor: 'var(--m-blue-light)', boxShadow: '0 0 20px rgba(28, 105, 212, 0.4)' }}>
                          <div className="stage-num" style={{ color: 'var(--m-red)' }}>★ 이번 개발 대상 (07)</div>
                          <div className="stage-title">금속 배선</div>
                          <div className="stage-desc">수로 파이프를 회전하고 이어 붙여 전류 요정들의 수로 연결하기</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div></div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls Info */}
      <footer className="controls-footer">
        <div>
          ORBIT <span>//</span> TEAM PRESENTATION
        </div>
        <div className="controls-indicator">
          <span>SPACE</span> <span>←</span> <span>→</span> TO NAVIGATE
        </div>
      </footer>
    </div>
  );
}
