// 사운드 재생 유틸리티
export const playClickSound = () => {
  try {
    const audio = new Audio('/sounds/click.mp3');
    audio.volume = 0.3; // 볼륨 조절
    audio.play().catch((error) => {
      console.log('사운드 재생 실패:', error);
    });
  } catch (error) {
    console.log('사운드 로드 실패:', error);
  }
};

export const playMatchSound = () => {
  try {
    const audio = new Audio('/sounds/match.mp3');
    audio.volume = 0.4;
    audio.play().catch((error) => {
      console.log('매치 사운드 재생 실패:', error);
    });
  } catch (error) {
    console.log('매치 사운드 로드 실패:', error);
  }
};

export const playBonusSound = () => {
  try {
    const audio = new Audio('/sounds/bonus.mp3');
    audio.volume = 0.4;
    audio.play().catch((error) => {
      console.log('보너스 사운드 재생 실패:', error);
    });
  } catch (error) {
    console.log('보너스 사운드 로드 실패:', error);
  }
};

export const playDroppedSound = () => {
  try {
    const audio = new Audio('/sounds/dropped.mp3');
    audio.volume = 0.3;
    audio.play().catch((error) => {
      console.log('드롭 사운드 재생 실패:', error);
    });
  } catch (error) {
    console.log('드롭 사운드 로드 실패:', error);
  }
};

export const playStageClearSound = () => {
  try {
    const audio = new Audio('/sounds/stageclear.mp3');
    audio.volume = 0.5;
    audio.play().catch((error) => {
      console.log('스테이지 클리어 사운드 재생 실패:', error);
    });
  } catch (error) {
    console.log('스테이지 클리어 사운드 로드 실패:', error);
  }
};

export const playPenaltySound = (penaltyType: 1 | 2 | 3) => {
  try {
    const audio = new Audio(`/sounds/penalty${penaltyType}.mp3`);
    audio.volume = 0.4;
    audio.play().catch((error) => {
      console.log('페널티 사운드 재생 실패:', error);
    });
  } catch (error) {
    console.log('페널티 사운드 로드 실패:', error);
  }
};
