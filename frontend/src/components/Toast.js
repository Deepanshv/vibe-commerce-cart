import React from "react";
// The `show` prop will be used to trigger the animation.
function Toast({ message, onClose, show }) {
  if (!show) {
    return null;
  }

  return (
    <div className="toast-notification">
      <span>{message}</span>
      <button onClick={onClose} className="toast-close">
        &times;
      </button>
    </div>
  );
}

export default Toast;
