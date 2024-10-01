import { t } from "../i18n";
import { HelpIcon } from "./excalicons";

type HelpButtonProps = {
  name?: string;
  id?: string;
  onClick?(): void;
};

export const HelpButton = (props: HelpButtonProps) => (
  <button
    className="help-icon"
    onClick={props.onClick}
    type="button"
    title={`${t("helpDialog.title")} — ?`}
    aria-label={t("helpDialog.title")}
  >
    {HelpIcon}
  </button>
);
