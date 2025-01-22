import React from "react";
import { useDevice } from "../App";

const MenuItemContent = ({
  icon,
  shortcut,
  children,
}: {
  icon?: React.ReactElement;
  shortcut?: string;
  children: React.ReactNode;
}) => {
  const device = useDevice();
  return (
    <>
      <div className="dropdown-menu-item__icon">{icon}</div>
      <div className="dropdown-menu-item__text">{children}</div>
      {shortcut && !device.editor.isMobile && (
        <div className="dropdown-menu-item__shortcut">{shortcut}</div>
      )}
    </>
  );
};
export default MenuItemContent;
