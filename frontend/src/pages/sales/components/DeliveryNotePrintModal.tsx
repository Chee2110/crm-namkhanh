import React from 'react';
import { Order } from '../../../types';
import { OrderDetailModal } from './OrderDetailModal';

interface DeliveryNotePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const DeliveryNotePrintModal: React.FC<DeliveryNotePrintModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  return (
    <OrderDetailModal
      isOpen={isOpen}
      onClose={onClose}
      order={order}
      initialSheet="DELIVERY"
    />
  );
};

export default DeliveryNotePrintModal;
