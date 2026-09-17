'use client';
import React from 'react';
import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'primary'
}) => {
  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>{cancelText}</Button>
      <Button variant={variant} onClick={onConfirm}>{confirmText}</Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <p>{message}</p>
    </Modal>
  );
};

export { ConfirmDialog };
export default ConfirmDialog;
