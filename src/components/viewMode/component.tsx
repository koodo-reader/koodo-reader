import { useTranslation } from "react-i18next";
import "./viewMode.css";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { viewMode as viewModeList } from "../../constants/viewMode";
import { useAppStore } from "../../store/useAppStore";

const ViewMode = () => {
  const viewMode = useAppStore((s) => s.manager.viewMode);
  const handleFetchViewMode = useAppStore((s) => s.handleFetchViewMode);
  const { t } = useTranslation();
  const handleChange = (mode: string) => {
    ConfigService.setReaderConfig("viewMode", mode);
    handleFetchViewMode();
  };
  return (
    <div className="book-list-view">
      {viewModeList.map((item) => (
        <div
          className="card-list-mode"
          onClick={() => {
            handleChange(item.mode);
          }}
          style={viewMode !== item.mode ? { opacity: 0.5 } : {}}
          key={item.mode}
        >
          <span
            data-tooltip-id="my-tooltip"
            data-tooltip-content={t(item.name)}
          >
            <span className={`icon-${item.icon}`}></span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default ViewMode;
