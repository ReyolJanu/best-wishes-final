"use client";
import React, { useRef } from 'react';

const CustomModal = ({ onClose, children }) => {
  const modalRef = useRef(null);

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal} ref={modalRef}>
        {children}
        <p>Hellooo</p>
        <button onClick={onClose} style={styles.closeBtn}>Close</button>
      </div>
    </div>
  );
};

export default CustomModal;

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '10px',
    width: '350px',
    textAlign: 'center',
    position: 'relative',
  },
  closeBtn: {
    marginTop: '15px',
  }
};
