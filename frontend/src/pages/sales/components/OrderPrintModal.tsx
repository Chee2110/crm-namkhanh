import React from 'react';
import { Order, OrderReturn } from '../../../types';
import { OrderDetailModal } from './OrderDetailModal';

interface OrderPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onEdit?: (order: Order) => void;
  onDelete?: (id: string, code: string, deliveryStatus: string) => void;
  onReturn?: (order: Order) => void;
  onPrintReturn?: (returnData: OrderReturn, order: Order) => void;
  hasPermission?: (resource: string, action: any) => boolean;
}

export const OrderPrintModal: React.FC<OrderPrintModalProps> = ({
  isOpen,
  onClose,
  order,
  onEdit,
  onDelete,
  onReturn,
  onPrintReturn,
  hasPermission
}) => {
  return (
    <OrderDetailModal
      isOpen={isOpen}
      onClose={onClose}
      order={order}
      onEdit={onEdit}
      onDelete={onDelete}
      onReturn={onReturn}
      onPrintReturn={onPrintReturn}
      hasPermission={hasPermission}
    />
  );
};

export default OrderPrintModal;
