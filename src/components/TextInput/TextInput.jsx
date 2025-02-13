import React from 'react';
import './TextInput.css';

export default function TextInput({ label, value, onChange, type = 'text', placeholder }) {
    return (
        <div className="kit-text-input">
            <label>{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    );
}