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
    <>
      <div className="flex items-center space-x-1">
        {/* Botón de editar - siempre visible */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleEditClick}
          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
          title="Editar"
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        
        {/* Botón de eliminar - siempre visible */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDeleteClick}
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Eliminar</span>
        </Button>
        
        {/* Menú desplegable para acciones adicionales */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" title="Más opciones">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onStatusChange && (
              <>
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
                  <XCircle className="mr-2 h-4 w-4" />
                  <span>Marcar como cancelada</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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