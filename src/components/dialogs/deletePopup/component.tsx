import { Trans } from "react-i18next";
import { DeletePopupProps } from "./interface";
import toast from "react-hot-toast";

const DeletePopup = (props: DeletePopupProps) => {
  const handleCancel = () => {
    props.handleDeletePopup(false);
  };
  const handleComfirm = () => {
    props.handleDeletePopup(false);
    props.handleDeleteOpearion();
    toast.success(props.t("Deletion successful"));
  };
  return (
    <div className="delete-dialog-container">
      <div className="delete-dialog-title">
        <Trans>{props.title}</Trans>
      </div>

      <div className="delete-dialog-book">
        <div className="delete-dialog-book-title">{props.name}</div>
      </div>

      <div className="delete-dialog-other-option">
        <Trans>{props.description}</Trans>
      </div>
      <div className="add-dialog-button-container">
        <div
          className="add-dialog-cancel"
          onClick={() => {
            handleCancel();
          }}
        >
          <Trans>Cancel</Trans>
        </div>
        <div
          className="add-dialog-confirm"
          onClick={() => {
            handleComfirm();
          }}
        >
          <Trans>Delete</Trans>
        </div>
      </div>
    </div>
  );
};

export default DeletePopup;
