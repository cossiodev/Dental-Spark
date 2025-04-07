import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '@/lib/models/types';

interface AppointmentActionsProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
  onStatusChange?: (appointment: Appointment, newStatus: string) => void;
}

export function AppointmentActions({ 
  appointment, 
  onEdit, 
  onDelete,
  onStatusChange
}: AppointmentActionsProps) {
  const { toast } = useToast();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Formatear fecha para mostrar
  const formattedDate = appointment.date ? 
    format(typeof appointment.date === 'string' ? parseISO(appointment.date) : appointment.date, 'PPP', { locale: es }) : 
    'Fecha no disponible';

  // Manejar clic en botón de editar
  const handleEditClick = () => {
    onEdit(appointment);
  };

  // Manejar clic en botón de eliminar
  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  // Confirmar eliminación de cita
  const confirmDelete = () => {
    onDelete(appointment.id);
    setOpenDeleteDialog(false);
    toast({
      title: "Cita eliminada",
      description: `La cita de ${appointment.patientName} ha sido eliminada.`,
    });
  };

  // Cambiar estado de cita
  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange({...appointment, status: newStatus}, newStatus);
      toast({
        title: "Estado actualizado",
        description: `La cita ahora está ${
          newStatus === 'scheduled' ? 'programada' :
          newStatus === 'confirmed' ? 'confirmada' :
          newStatus === 'completed' ? 'completada' :
          newStatus === 'cancelled' ? 'cancelada' : newStatus
        }.`,
      });
    }
  };

  return (
    <div className="flex justify-center items-center gap-2 flex-wrap">
      {/* Botones principales con etiquetas de texto */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleEditClick}
        className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800 w-28 h-9"
      >
        <Edit className="h-4 w-4" />
        <span>Editar</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDeleteClick} 
        className="flex items-center gap-1 bg-red-50 hover:bg-red-100 border-red-200 text-red-800 w-28 h-9"
      >
        <Trash2 className="h-4 w-4" />
        <span>Eliminar</span>
      </Button>
      
      {/* Menú de estados (si se proporciona la función) */}
      {onStatusChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-gray-50 hover:bg-gray-100 border-gray-200 h-9"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusChange('scheduled')}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Programada</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('confirmed')}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Confirmada</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Completada</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('cancelled')}>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>Cancelada</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la cita del paciente {appointment.patientName} 
              programada para el {formattedDate} a las {appointment.startTime}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 