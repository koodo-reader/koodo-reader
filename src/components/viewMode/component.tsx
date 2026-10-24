import "./viewMode.css";
import { ViewModeProps } from "./interface";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { viewMode } from "../../constants/viewMode";

const ViewMode = (props: ViewModeProps) => {
  const handleChange = (mode: string) => {
    ConfigService.setReaderConfig("viewMode", mode);
    props.handleFetchViewMode();
  };
  return (
    <div className="book-list-view">
      {viewMode.map((item) => (
        <div
          className="card-list-mode"
          onClick={() => {
            handleChange(item.mode);
          }}
          style={props.viewMode !== item.mode ? { opacity: 0.5 } : {}}
          key={item.mode}
        >
          <span
            data-tooltip-id="my-tooltip"
            data-tooltip-content={props.t(item.name)}
          >
            <span className={`icon-${item.icon}`}></span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default ViewMode;
