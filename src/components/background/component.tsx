import { useEffect, useRef, useState } from "react";
import "./background.css";
import { BackgroundProps } from "./interface";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { getPageWidth, throttle } from "../../utils/common";
import BackgroundUtil from "../../utils/file/backgroundUtil";

const Background = (props: BackgroundProps) => {
  const [isSingle, setIsSingle] = useState(props.readerMode !== "double");
  const [pageSize, setPageSize] = useState<{
    pageOffset: string;
    pageWidth: string;
  }>({ pageOffset: "", pageWidth: "" });
  const [readerBackgroundUrl, setReaderBackgroundUrl] = useState("");
  const propsRef = useRef(props);
  propsRef.current = props;
  const isFirstBackgroundEffect = useRef(true);

  const loadReaderBackground = async (imageId?: string) => {
    const id =
      imageId ?? ConfigService.getReaderConfig("readerBackgroundImage") ?? "";
    if (!id) {
      setReaderBackgroundUrl("");
      return;
    }
    const meta = BackgroundUtil.getImageMeta(id);
    const url = await BackgroundUtil.loadImage(id, meta?.extension);
    setReaderBackgroundUrl(url || "");
  };

  useEffect(() => {
    const current = propsRef.current;
    setPageSize(
      getPageWidth(
        current.readerMode,
        current.scale,
        parseInt(current.margin),
        current.isNavLocked,
        current.isSettingLocked || current.isDockedRight,
        current.isFitPage
      )
    );
    loadReaderBackground();
    const resizeHandler = throttle(() => {
      const latest = propsRef.current;
      setPageSize(
        getPageWidth(
          latest.readerMode,
          latest.scale,
          parseInt(latest.margin),
          latest.isNavLocked,
          latest.isSettingLocked || latest.isDockedRight,
          latest.isFitPage
        )
      );
    });
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  useEffect(() => {
    setPageSize(
      getPageWidth(
        props.readerMode,
        props.scale,
        parseInt(props.margin),
        props.isNavLocked,
        props.isSettingLocked || props.isDockedRight,
        props.isFitPage
      )
    );
  }, [
    props.margin,
    props.scale,
    props.readerMode,
    props.isNavLocked,
    props.isSettingLocked,
    props.isDockedRight,
    props.isFitPage,
  ]);

  useEffect(() => {
    setIsSingle(props.readerMode !== "double");
  }, [props.readerMode]);

  useEffect(() => {
    if (isFirstBackgroundEffect.current) {
      isFirstBackgroundEffect.current = false;
      return;
    }
    loadReaderBackground(props.readerBackgroundImage ?? "");
  }, [props.readerBackgroundImage]);

  return (
    <>
      <div
        className="background-box2"
        style={
          isSingle
            ? {
                left: pageSize.pageOffset,
                marginLeft: -50,
                width: `calc(${pageSize.pageWidth} + 98px)`,
                boxShadow: "0 0 0px rgba(191, 191, 191, 1)",
              }
            : {
                left: props.isNavLocked ? 305 : 5,
                right:
                  props.isSettingLocked || props.isDockedRight ? 305 : 5,
              }
        }
      ></div>

      <div
        className="background-box3"
        style={
          isSingle
            ? {
                marginLeft: -50,
                left: pageSize.pageOffset,
                width: `calc(${pageSize.pageWidth} + 100px)`,
              }
            : {
                left: props.isNavLocked ? 307 : 7,
                right:
                  props.isSettingLocked || props.isDockedRight ? 307 : 7,
              }
        }
      >
        {(() => {
          const isDarkMode =
            (!props.backgroundColor &&
              (ConfigService.getReaderConfig("appSkin") === "night" ||
                (ConfigService.getReaderConfig("appSkin") === "system" &&
                  ConfigService.getReaderConfig("isOSNight") === "yes"))) ||
            props.backgroundColor === "rgba(44,47,49,1)";

          const shadowOpacity = isDarkMode ? 0.5 : undefined;

          return (
            <>
              <div
                className="spine-shadow-left"
                style={{
                  ...(isSingle && { display: "none" }),
                  ...(shadowOpacity && { opacity: shadowOpacity }),
                }}
              ></div>
              <div
                className="book-spine"
                style={isSingle ? { display: "none" } : {}}
              ></div>
              <div
                className="spine-shadow-right"
                style={{
                  ...(isSingle && {
                    position: "relative",
                    right: 0,
                  }),
                  ...(shadowOpacity && { opacity: shadowOpacity }),
                }}
              ></div>
            </>
          );
        })()}
      </div>

      <div
        className="background-box1"
        style={
          isSingle
            ? {
                marginLeft: -50,
                left: pageSize.pageOffset,
                width: `calc(${pageSize.pageWidth} + 102px)`,
                boxShadow: "0 0 0px rgba(191, 191, 191, 1)",
                ...(readerBackgroundUrl
                  ? {
                      backgroundImage: `url("${readerBackgroundUrl}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {}),
              }
            : {
                left: props.isNavLocked ? 309 : 9,
                right:
                  props.isSettingLocked || props.isDockedRight ? 309 : 9,
                ...(readerBackgroundUrl
                  ? {
                      backgroundImage: `url("${readerBackgroundUrl}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {}),
              }
        }
      ></div>
    </>
  );
};

export default Background;
