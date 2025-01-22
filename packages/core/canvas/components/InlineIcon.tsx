import React from 'react';

export const InlineIcon = ({ icon }: { icon: React.ReactElement }) => {
  return (
    <span
      style={{
        width: "1em",
        margin: "0 0.5ex 0 0.5ex",
        display: "inline-block",
        lineHeight: 0,
        verticalAlign: "middle",
      }}
    >
      {icon}
    </span>
  );
};
