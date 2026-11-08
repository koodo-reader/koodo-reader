import Lottie, { LottieComponentProps } from "lottie-react";
import { useEffect, useState } from "react";

const animationLoaders = {
  success: () => import("../../assets/lotties/success.json"),
  safe: () => import("../../assets/lotties/safe.json"),
  new: () => import("../../assets/lotties/new.json"),
  support: () => import("../../assets/lotties/support.json"),
  exit: () => import("../../assets/lotties/exit.json"),
};

export type LazyLottieAnimation = keyof typeof animationLoaders;

export interface LazyLottieProps
  extends Omit<LottieComponentProps, "animationData"> {
  animation: LazyLottieAnimation;
}

const LazyLottie = ({ animation, ...props }: LazyLottieProps) => {
  const [animationData, setAnimationData] = useState<unknown>(null);

  useEffect(() => {
    let isCancelled = false;
    setAnimationData(null);
    animationLoaders[animation]().then((module) => {
      if (!isCancelled) {
        setAnimationData(module.default);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [animation]);

  if (!animationData) {
    return <div className={props.className} style={props.style} />;
  }

  return <Lottie animationData={animationData} {...props} />;
};

export default LazyLottie;
