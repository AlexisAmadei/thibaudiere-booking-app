/**
 * Button component renders a customizable button element.
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The content to be displayed inside the button.
 * @param {function} props.onClick - The function to be called when the button is clicked.
 * @param {string} [props.variant] - The variant of the button for styling purposes (e.g., "outlined").
 * @param {string} [props.type] - The type attribute of the button element (e.g., "button", "submit").
 * @param {boolean} [props.fullWidth] - If true, the button will take the full width of its container.
 *
 * @returns {JSX.Element} The rendered button component.
 */
import "./Button.css";
import React from "react";

export default function Button({ children, onClick, variant, type, fullWidth }) {
    return (
        <button
            className={`kit-button ${variant} ${fullWidth ? 'fullwidth' : ''}`}
            onClick={onClick}
            type={type}
        >
            {children}
        </button>
    );
}