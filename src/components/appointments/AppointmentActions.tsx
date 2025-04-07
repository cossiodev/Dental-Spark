import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Calendar,
  CheckCircle
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEditClick}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeleteClick}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Eliminar</span>
          </DropdownMenuItem>
          
          {onStatusChange && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                disabled={appointment.status === 'scheduled'}
                onClick={() => handleStatusChange('scheduled')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Marcar como programada</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                disabled={appointment.status === 'confirmed'}
                onClick={() => handleStatusChange('confirmed')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Marcar como confirmada</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                disabled={appointment.status === 'completed'}
                onClick={() => handleStatusChange('completed')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Marcar como completada</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                disabled={appointment.status === 'cancelled'}
                onClick={() => handleStatusChange('cancelled')}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Marcar como cancelada</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la cita de {appointment.patientName} 
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
    </>
  );
} 