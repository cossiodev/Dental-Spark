import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Save, User, AlertCircle, Baby, ChevronDown, ChevronUp, Search, RefreshCw, PlusCircle, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { patientService, Patient, odontogramService, Treatment, treatmentService } from "@/lib/data-service";
import ToothIcon from "@/components/icons/ToothIcon";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PersonStanding } from "lucide-react";

interface ToothCondition {
  status: "healthy" | "caries" | "filling" | "crown" | "extraction" | "implant" | "root-canal";
  notes?: string;
  surfaces?: ("top" | "bottom" | "left" | "right" | "center")[];
}

const upperTeeth = [
  { number: 18, x: 40, y: 40 },
  { number: 17, x: 80, y: 40 },
  { number: 16, x: 120, y: 40 },
  { number: 15, x: 160, y: 40 },
  { number: 14, x: 200, y: 40 },
  { number: 13, x: 240, y: 40 },
  { number: 12, x: 280, y: 40 },
  { number: 11, x: 320, y: 40 },
  { number: 21, x: 360, y: 40 },
  { number: 22, x: 400, y: 40 },
  { number: 23, x: 440, y: 40 },
  { number: 24, x: 480, y: 40 },
  { number: 25, x: 520, y: 40 },
  { number: 26, x: 560, y: 40 },
  { number: 27, x: 600, y: 40 },
  { number: 28, x: 640, y: 40 },
];

const lowerTeeth = [
  { number: 48, x: 40, y: 120 },
  { number: 47, x: 80, y: 120 },
  { number: 46, x: 120, y: 120 },
  { number: 45, x: 160, y: 120 },
  { number: 44, x: 200, y: 120 },
  { number: 43, x: 240, y: 120 },
  { number: 42, x: 280, y: 120 },
  { number: 41, x: 320, y: 120 },
  { number: 31, x: 360, y: 120 },
  { number: 32, x: 400, y: 120 },
  { number: 33, x: 440, y: 120 },
  { number: 34, x: 480, y: 120 },
  { number: 35, x: 520, y: 120 },
  { number: 36, x: 560, y: 120 },
  { number: 37, x: 600, y: 120 },
  { number: 38, x: 640, y: 120 },
];

const upperPediatricTeeth = [
  { number: 55, x: 160, y: 40 },
  { number: 54, x: 200, y: 40 },
  { number: 53, x: 240, y: 40 },
  { number: 52, x: 280, y: 40 },
  { number: 51, x: 320, y: 40 },
  { number: 61, x: 360, y: 40 },
  { number: 62, x: 400, y: 40 },
  { number: 63, x: 440, y: 40 },
  { number: 64, x: 480, y: 40 },
  { number: 65, x: 520, y: 40 },
];

const lowerPediatricTeeth = [
  { number: 85, x: 160, y: 120 },
  { number: 84, x: 200, y: 120 },
  { number: 83, x: 240, y: 120 },
  { number: 82, x: 280, y: 120 },
  { number: 81, x: 320, y: 120 },
  { number: 71, x: 360, y: 120 },
  { number: 72, x: 400, y: 120 },
  { number: 73, x: 440, y: 120 },
  { number: 74, x: 480, y: 120 },
  { number: 75, x: 520, y: 120 },
];

const allAdultTeeth = [...upperTeeth, ...lowerTeeth];
const allPediatricTeeth = [...upperPediatricTeeth, ...lowerPediatricTeeth];

const toothConditionColors: Record<string, string> = {
  healthy: "#ffffff",
  caries: "#ffc107",
  filling: "#e0e0e0",
  crown: "#ffd700",
  extraction: "#ff5252",
  implant: "#2196f3",
  "root-canal": "#4caf50",
};

const toothConditionLabels: Record<string, string> = {
  healthy: "Sano",
  caries: "Caries",
  filling: "Empaste",
  crown: "Corona",
  extraction: "Extracción",
  implant: "Implante",
  "root-canal": "Conducto",
};

interface SuggestedTreatment {
  toothNumber: number;
  condition: ToothCondition;
  treatmentType: string;
  cost: number;
}

const Odontogram = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [teethConditions, setTeethConditions] = useState<Record<number, ToothCondition>>({});
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition["status"]>("healthy");
  const [selectedSurfaces, setSelectedSurfaces] = useState<ToothCondition["surfaces"]>([]);
  const [toothNotes, setToothNotes] = useState<string>("");
  const [generalNotes, setGeneralNotes] = useState<string>("");
  const [isToothDialogOpen, setIsToothDialogOpen] = useState(false);
  const [isTreatmentDialogOpen, setIsTreatmentDialogOpen] = useState(false);
  const [suggestedTreatments, setSuggestedTreatments] = useState<SuggestedTreatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isPediatric, setIsPediatric] = useState(false);
  const [teethType, setTeethType] = useState<"adult" | "child">("adult");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [toothHistory, setToothHistory] = useState<{ date: string, condition: string }[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const patientId = params.get("patientId");
    const date = params.get("date");
    
    if (patientId) {
      setSelectedPatient(patientId);
      
      if (date) {
        setSelectedDate(date);
        setIsViewMode(true);
      }
    }
  }, [search]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar todos los pacientes
        console.log("[DIAGNÓSTICO] Iniciando carga de pacientes...");
        const patientsData = await patientService.getAll();
        console.log("[DIAGNÓSTICO] Pacientes cargados:", patientsData.length);
        setPatients(patientsData);
        
        // Aplicar filtro si hay query de búsqueda
        if (searchQuery) {
          const filtered = patientsData.filter(patient => 
            `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setFilteredPatients(filtered);
        } else {
          setFilteredPatients(patientsData);
        }
        
        // Cargar pacientes recientes
        const recentPatientsData = await patientService.getRecent(10);
        setRecentPatients(recentPatientsData);
        
      } catch (error) {
        console.error("Error loading patients:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los pacientes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [searchQuery, toast]);

  useEffect(() => {
    const loadOdontogramData = async () => {
      if (!selectedPatient) return;
      
      try {
        setIsLoading(true);
        
        // Buscar el paciente seleccionado
        const patient = patients.find(p => p.id === selectedPatient);
        setCurrentPatient(patient || null);
        
        if (patient) {
          console.log(`[DIAGNÓSTICO] Paciente encontrado:`, patient.firstName, patient.lastName);
          setIsPediatric(!!patient.isPediatric);
          setTeethType(patient.isPediatric ? "child" : "adult");
          
          // Cargar odontograma existente para la fecha seleccionada
          console.log(`[DIAGNÓSTICO] Buscando odontogramas para paciente ${patient.id} en fecha ${selectedDate}`);
          const patientOdontograms = await odontogramService.getByPatientId(selectedPatient);
          const todayOdontogram = patientOdontograms.find(o => o.date === selectedDate);
          
          if (todayOdontogram) {
            console.log(`[DIAGNÓSTICO] Odontograma encontrado para la fecha:`, todayOdontogram);
            setTeethConditions(todayOdontogram.teeth);
            setGeneralNotes(todayOdontogram.notes || "");
            setIsPediatric(!!todayOdontogram.isPediatric);
            toast({
              title: "Odontograma cargado",
              description: "Se ha cargado un odontograma existente para la fecha seleccionada",
            });
          } else {
            console.log(`[DIAGNÓSTICO] No se encontró odontograma para la fecha seleccionada`);
            setTeethConditions({});
            setGeneralNotes("");
          }
        } else {
          console.error(`[DIAGNÓSTICO] No se encontró el paciente con ID ${selectedPatient}`);
        }
      } catch (error) {
        console.error("Error loading odontogram data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del odontograma",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOdontogramData();
  }, [selectedPatient, selectedDate, patients, toast]);

  const generateTreatmentSuggestions = () => {
    const suggestions: SuggestedTreatment[] = [];
    
    Object.entries(teethConditions).forEach(([toothNum, condition]) => {
      if (condition.status !== "healthy" && condition.status !== "filling") {
        let treatmentType = "";
        let cost = 0;
        
        switch (condition.status) {
          case "caries":
            treatmentType = "Empaste";
            cost = 100;
            break;
          case "extraction":
            treatmentType = "Extracción";
            cost = 120;
            break;
          case "root-canal":
            treatmentType = "Tratamiento de Conducto";
            cost = 600;
            break;
          case "crown":
            treatmentType = "Corona";
            cost = 500;
            break;
          case "implant":
            treatmentType = "Implante";
            cost = 1200;
            break;
        }
        
        if (treatmentType) {
          suggestions.push({
            toothNumber: parseInt(toothNum),
            condition,
            treatmentType,
            cost,
          });
        }
      }
    });
    
    return suggestions;
  };

  const handleToothClick = (toothNumber: number) => {
    if (isViewMode) return;
    
    setSelectedTooth(toothNumber);
    const currentCondition = teethConditions[toothNumber];
    
    if (currentCondition) {
      setSelectedCondition(currentCondition.status);
      setToothNotes(currentCondition.notes || "");
      setSelectedSurfaces(currentCondition.surfaces || []);
    } else {
      setSelectedCondition("healthy");
      setToothNotes("");
      setSelectedSurfaces([]);
    }
    
    setIsToothDialogOpen(true);
  };

  const handleSurfaceToggle = (surface: "top" | "bottom" | "left" | "right" | "center") => {
    setSelectedSurfaces(prev => {
      if (prev?.includes(surface)) {
        return prev.filter(s => s !== surface);
      } else {
        return [...(prev || []), surface];
      }
    });
  };

  const handleSaveToothCondition = () => {
    if (selectedTooth === null) return;
    
    const updatedConditions = { ...teethConditions };
    
    if (selectedCondition === "healthy" && !toothNotes && (!selectedSurfaces || selectedSurfaces.length === 0)) {
      delete updatedConditions[selectedTooth];
    } else {
      updatedConditions[selectedTooth] = {
        status: selectedCondition,
        notes: toothNotes || undefined,
        surfaces: selectedSurfaces && selectedSurfaces.length > 0 ? selectedSurfaces : undefined,
      };
    }
    
    setTeethConditions(updatedConditions);
    setIsToothDialogOpen(false);
    
    setSuggestedTreatments(generateTreatmentSuggestions());
  };

  const handleSaveOdontogram = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Por favor seleccione un paciente",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const odontogramData = {
        patientId: selectedPatient,
        date: selectedDate,
        teeth: teethConditions,
        notes: generalNotes,
        isPediatric: isPediatric,
      };
      
      const savedOdontogram = await odontogramService.create(odontogramData);
      
      const suggestions = generateTreatmentSuggestions();
      if (suggestions.length > 0) {
        setSuggestedTreatments(suggestions);
        setIsTreatmentDialogOpen(true);
      } else {
        toast({
          title: "Odontograma guardado",
          description: "El odontograma ha sido guardado exitosamente",
        });
        
        const params = new URLSearchParams(search);
        const fromPatient = params.get("patientId");
        
        if (fromPatient) {
          navigate(`/patients/${fromPatient}`);
        }
      }
    } catch (error) {
      console.error("Error saving odontogram:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el odontograma",
        variant: "destructive",
      });
    }
  };

  const handleCreateTreatments = async () => {
    if (!selectedPatient || suggestedTreatments.length === 0) return;
    
    try {
      const treatments: Treatment[] = [];
      
      for (const suggestion of suggestedTreatments) {
        const newTreatment = await treatmentService.create({
          patientId: selectedPatient,
          patientName: currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : "",
          doctorId: selectedPatient,
          doctorName: "Dr. Carlos Rodríguez",
          type: suggestion.treatmentType,
          description: `${suggestion.treatmentType} para diente ${suggestion.toothNumber}`,
          teeth: [suggestion.toothNumber],
          status: "planned",
          cost: suggestion.cost,
          startDate: format(new Date(), "yyyy-MM-dd"),
          notes: suggestion.condition.notes,
          suggestedByOdontogram: true,
        });
        
        treatments.push(newTreatment);
      }
      
      toast({
        title: "Tratamientos creados",
        description: `Se han creado ${treatments.length} tratamientos basados en el odontograma`,
      });
      
      setIsTreatmentDialogOpen(false);
      
      const params = new URLSearchParams(search);
      const fromPatient = params.get("patientId");
      
      if (fromPatient) {
        navigate(`/patients/${fromPatient}`);
      } else {
        navigate(`/treatments?patientId=${selectedPatient}`);
      }
    } catch (error) {
      console.error("Error creating treatments:", error);
      toast({
        title: "Error",
        description: "No se pudieron crear los tratamientos",
        variant: "destructive",
      });
    }
  };

  const getToothIcon = (toothNumber: number) => {
    // Dental numbering system groups:
    // Incisors: 11, 12, 21, 22, 31, 32, 41, 42
    // Canines: 13, 23, 33, 43
    // Premolars: 14, 15, 24, 25, 34, 35, 44, 45
    // Molars: 16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48
    
    // Determine if it's an upper or lower tooth
    const isUpper = [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28].includes(toothNumber);
    
    if ([11, 12, 21, 22, 31, 32, 41, 42].includes(toothNumber)) {
      // Incisor shape - more anatomically correct
      if (isUpper) {
        // Upper incisor
        return (
          <path 
            d="M32 8 C38 8, 44 12, 44 32 C44 45, 38 56, 32 56 C26 56, 20 45, 20 32 C20 12, 26 8, 32 8 Z
               M26 10 L38 10 L36 14 L28 14 Z" 
            stroke="#666"
            strokeWidth="1"
          />
        );
      } else {
        // Lower incisor
        return (
          <path 
            d="M32 8 C38 8, 44 18, 44 45 C44 52, 38 56, 32 56 C26 56, 20 52, 20 45 C20 18, 26 8, 32 8 Z
               M26 52 L38 52 L36 48 L28 48 Z" 
            stroke="#666"
            strokeWidth="1"
          />
        );
      }
    } else if ([13, 23, 33, 43].includes(toothNumber)) {
      // Canine shape - sharper cusp
      if (isUpper) {
        // Upper canine
        return (
          <path 
            d="M32 4 C38 4, 45 10, 46 32 C46 45, 38 56, 32 56 C26 56, 18 45, 18 32 C19 10, 26 4, 32 4 Z
               M32 4 L32 10 M26 9 L38 9" 
            stroke="#666"
            strokeWidth="1"
          />
        );
      } else {
        // Lower canine
        return (
          <path 
            d="M32 6 C38 6, 46 14, 46 42 C46 52, 38 58, 32 58 C26 58, 18 52, 18 42 C18 14, 26 6, 32 6 Z
               M32 58 L32 52 M26 54 L38 54" 
            stroke="#666"
            strokeWidth="1"
          />
        );
      }
    } else if ([14, 15, 24, 25, 34, 35, 44, 45].includes(toothNumber)) {
      // Premolar shape - with two distinct cusps
      if (isUpper) {
        // Upper premolar
        return (
          <path 
            d="M32 8 C42 8, 48 12, 48 32 C48 45, 39 56, 32 56 C25 56, 16 45, 16 32 C16 12, 22 8, 32 8 Z" 
            stroke="#666"
            strokeWidth="1"
          />
        );
      } else {
        // Lower premolar
        return (
          <path 
            d="M32 8 C42 8, 48 14, 48 40 C48 50, 39 58, 32 58 C25 58, 16 50, 16 40 C16 14, 22 8, 32 8 Z" 
            stroke="#666"
            strokeWidth="1"
          />
        );
      }
    } else {
      // Molar shape - with multiple cusps
      if (isUpper) {
        // Upper molar
        return (
          <path 
            d="M18 14 L46 14 L46 50 C46 54, 40 58, 32 58 C24 58, 18 54, 18 50 Z
               M18 14 C18 10, 24 6, 32 6 C40 6, 46 10, 46 14
               M25 14 L25 8 M39 14 L39 8" 
            stroke="#666"
            strokeWidth="1"
          />
        );
      } else {
        // Lower molar
        return (
          <path 
            d="M18 14 C18 10, 24 6, 32 6 C40 6, 46 10, 46 14 L46 50 L18 50 Z
               M18 50 C18 54, 24 58, 32 58 C40 58, 46 54, 46 50
               M25 50 L25 56 M39 50 L39 56" 
            stroke="#666"
            strokeWidth="1"
          />
        );
      }
    }
  };

  const renderTeeth = () => {
    const upperTeethToRender = teethType === "adult" ? upperTeeth : upperPediatricTeeth;
    const lowerTeethToRender = teethType === "adult" ? lowerTeeth : lowerPediatricTeeth;
    
    const renderToothGroup = (teethGroup: typeof upperTeeth) => {
      return teethGroup.map((tooth) => {
        const condition = teethConditions[tooth.number];
        const fillColor = condition ? toothConditionColors[condition.status] : "white";
        const isSelected = selectedTooth === tooth.number;
        const hasSurfaces = condition && condition.surfaces && condition.surfaces.length > 0;
        
        return (
          <button
            key={tooth.number}
            className={`relative group p-0 w-16 h-20 flex items-center justify-center border rounded-md 
              transition-all duration-200 hover:scale-105 hover:shadow-md 
              ${isSelected ? 'ring-2 ring-primary shadow-md' : 'ring-0'} 
              ${condition ? `tooth-${condition.status}` : 'bg-white'}`}
            onClick={() => handleToothClick(tooth.number)}
            disabled={isViewMode}
            style={{
              borderStyle: condition?.status === "extraction" ? "dashed" : "solid",
              backgroundColor: hasSurfaces ? "white" : fillColor
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 64 64" className="absolute inset-0">
                {getToothIcon(tooth.number)}
                
                {/* Fill the tooth based on condition */}
                <g fill={hasSurfaces ? "white" : fillColor}>
                  {getToothIcon(tooth.number)}
                </g>
                
                {hasSurfaces && (
                  <>
                    {condition.surfaces?.includes("top") && (
                      <path 
                        d="M24 12 L40 12 C36 18, 28 18, 24 12 Z" 
                        fill={fillColor} 
                      />
                    )}
                    {condition.surfaces?.includes("left") && (
                      <path 
                        d="M18 20 C18 30, 22 40, 26 50 C22 44, 18 35, 18 20 Z" 
                        fill={fillColor} 
                      />
                    )}
                    {condition.surfaces?.includes("right") && (
                      <path 
                        d="M46 20 C46 30, 42 40, 38 50 C42 44, 46 35, 46 20 Z" 
                        fill={fillColor} 
                      />
                    )}
                    {condition.surfaces?.includes("bottom") && (
                      <path 
                        d="M26 50 L38 50 C36 54, 28 54, 26 50 Z" 
                        fill={fillColor} 
                      />
                    )}
                    {condition.surfaces?.includes("center") && (
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="10" 
                        fill={fillColor} 
                      />
                    )}
                  </>
                )}
              </svg>
              
              <span className="text-base font-bold z-10">{tooth.number}</span>
            </div>
            
            {condition && (
              <div className="absolute top-1 right-1 z-10">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: toothConditionColors[condition.status] }} />
              </div>
            )}
            
            {condition?.notes && (
              <div className="absolute bottom-1 right-1 text-xs text-blue-500">
                <span className="w-3 h-3 flex items-center justify-center rounded-full bg-blue-100 text-blue-500">i</span>
              </div>
            )}
            
            <div className="absolute opacity-0 group-hover:opacity-100 -bottom-12 bg-popover text-popover-foreground p-2 rounded shadow-lg text-xs z-50 transition-opacity min-w-32 text-center pointer-events-none">
              Diente {tooth.number}
              {condition && (
                <div>Estado: {toothConditionLabels[condition.status]}</div>
              )}
              {condition?.notes && (
                <div className="truncate max-w-36">Nota: {condition.notes}</div>
              )}
            </div>
          </button>
        );
      });
    };
    
    return (
      <div className="space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="text-lg font-semibold">Dientes Superiores</h3>
            <Badge variant="outline" className="ml-2">
              {teethType === "adult" ? "1-16" : "A-J"}
            </Badge>
          </div>
          <div className="grid grid-cols-8 gap-1 mt-4 justify-items-center">
            {renderToothGroup(upperTeethToRender)}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="text-lg font-semibold">Dientes Inferiores</h3>
            <Badge variant="outline" className="ml-2">
              {teethType === "adult" ? "17-32" : "K-T"}
            </Badge>
          </div>
          <div className="grid grid-cols-8 gap-1 mt-4 justify-items-center">
            {renderToothGroup(lowerTeethToRender)}
          </div>
        </div>
        
        <div className="pt-6 border-t">
          <h3 className="text-base font-medium mb-3">Leyenda</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(toothConditionLabels).map(([condition, label]) => (
              <div key={condition} className="flex items-center gap-2 bg-background border rounded-full px-3 py-1.5">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: toothConditionColors[condition] }}></div>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handlePatientChange = (value: string) => {
    console.log("[DIAGNÓSTICO] Cambiando paciente seleccionado a:", value);
    setSelectedPatient(value);
    
    // Buscar el paciente en la lista y actualizar si es pediátrico
    const patient = patients.find(p => p.id === value);
    if (patient) {
      console.log("[DIAGNÓSTICO] ¿Es paciente pediátrico?", patient.isPediatric ? "Sí" : "No");
      setIsPediatric(!!patient.isPediatric);
      // Actualizar automáticamente el tipo de dientes según el paciente
      setTeethType(patient.isPediatric ? "child" : "adult");
    }
  };

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "Actualizando pacientes",
        description: "Cargando lista de pacientes...",
      });
      
      console.log("[DIAGNÓSTICO] Actualizando lista de pacientes...");
      const patientsData = await patientService.getAll();
      console.log("[DIAGNÓSTICO] Pacientes obtenidos correctamente:", patientsData.length);
      setPatients(patientsData);
      
      // Aplicar filtro si hay query de búsqueda
      if (searchQuery) {
        const filtered = patientsData.filter(patient => 
          `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPatients(filtered);
      } else {
        setFilteredPatients(patientsData);
      }
      
      toast({
        title: "Pacientes actualizados",
        description: `Se han cargado ${patientsData.length} pacientes`,
      });
    } catch (error) {
      console.error("Error updating patients:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los pacientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveTeethConditions = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Por favor seleccione un paciente",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const odontogramData = {
        patientId: selectedPatient,
        date: selectedDate,
        teeth: teethConditions,
        notes: generalNotes,
        isPediatric: isPediatric,
      };
      
      const savedOdontogram = await odontogramService.create(odontogramData);
      
      toast({
        title: "Odontograma guardado",
        description: "El odontograma ha sido guardado exitosamente",
      });
      
      // Si hay tratamientos sugeridos, mostrarlos
      const suggestions = generateTreatmentSuggestions();
      if (suggestions.length > 0) {
        setSuggestedTreatments(suggestions);
      }
    } catch (error) {
      console.error("Error saving odontogram:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el odontograma",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Odontograma</h1>
          <p className="text-muted-foreground">Visualiza y edita el odontograma de tus pacientes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPatients} className="h-10">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Actualizar Pacientes</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-wrap">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar paciente..."
              className="pl-8 w-full md:w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-80">
            <Select value={selectedPatient} onValueChange={handlePatientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un paciente" />
              </SelectTrigger>
              <SelectContent>
                {filteredPatients.length > 0 ? (
                  <>
                    {searchQuery && <div className="px-2 py-1.5 text-sm text-muted-foreground">Resultados de búsqueda</div>}
                    {filteredPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                        {patient.isPediatric && " (Pediátrico)"}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <div className="px-2 py-4 text-center text-muted-foreground">
                    No se encontraron pacientes
                  </div>
                )}
                
                {recentPatients.length > 0 && (
                  <>
                    <SelectSeparator />
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Pacientes recientes</div>
                    {recentPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                        {patient.isPediatric && " (Pediátrico)"}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-auto flex justify-end">
            <ToggleGroup type="single" variant="outline" value={teethType} onValueChange={value => {
              if (value) setTeethType(value as "adult" | "child");
            }}>
              <ToggleGroupItem value="adult" aria-label="Dientes adultos">
                <PersonStanding className="h-4 w-4 mr-2" />
                Adulto
              </ToggleGroupItem>
              <ToggleGroupItem value="child" aria-label="Dientes pediátricos">
                <Baby className="h-4 w-4 mr-2" />
                Pediátrico
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {selectedPatient ? (
        <Card className="border shadow-sm">
          <CardHeader className="bg-card border-b">
            <CardTitle>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {currentPatient ? (
                  <>Odontograma de {currentPatient.firstName} {currentPatient.lastName}</>
                ) : (
                  <>Odontograma de Paciente</>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              {currentPatient?.isPediatric ? (
                <>Odontograma pediátrico - Seleccione un diente para registrar su condición</>
              ) : (
                <>Seleccione un diente para registrar su condición</>
              )}
            </CardDescription>
            
            <div className="flex items-center justify-end mt-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p>Cargando odontograma...</p>
              </div>
            ) : (
              renderTeeth()
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 border-t flex-col items-stretch gap-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="generalNotes">Notas generales del odontograma</Label>
              <Textarea
                id="generalNotes"
                placeholder="Añada notas generales sobre el estado dental del paciente"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="min-h-[80px] resize-y"
              />
            </div>
            
            {suggestedTreatments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Tratamientos Recomendados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestedTreatments.map((treatment, index) => (
                    <Card key={index} className="border border-muted">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">{treatment.treatmentType}</CardTitle>
                        <Badge>${treatment.cost}</Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <ToothIcon className="h-4 w-4 text-muted-foreground" />
                          <span>Diente {treatment.toothNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: toothConditionColors[treatment.condition.status] }}></div>
                          <span>{toothConditionLabels[treatment.condition.status]}</span>
                        </div>
                        {treatment.condition.notes && (
                          <div className="text-sm mt-2 italic text-muted-foreground">{treatment.condition.notes}</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                const suggestions = generateTreatmentSuggestions();
                setSuggestedTreatments(suggestions);
                if (suggestions.length === 0) {
                  toast({
                    title: "Sin recomendaciones",
                    description: "No hay tratamientos para recomendar basados en el odontograma actual",
                  });
                }
              }}>
                <Lightbulb className="h-4 w-4 mr-2" />
                Sugerir Tratamientos
              </Button>
              <Button onClick={saveTeethConditions}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ToothIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay paciente seleccionado</h3>
              <p className="text-muted-foreground">Seleccione un paciente para ver su odontograma</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* El diálogo de condición de diente */}
      <Dialog open={isToothDialogOpen} onOpenChange={setIsToothDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ToothIcon className="h-5 w-5" /> Diente {selectedTooth}
            </DialogTitle>
            <DialogDescription>
              Registre la condición actual y las superficies afectadas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Tabs defaultValue="condition" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="condition">Condición</TabsTrigger>
                <TabsTrigger value="surfaces">Superficies</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
              </TabsList>
              
              <TabsContent value="condition" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(toothConditionLabels).map(([value, label]) => {
                    const isSelected = selectedCondition === value;
                    return (
                      <Button
                        key={value}
                        variant={isSelected ? "default" : "outline"}
                        className={`h-auto py-2 px-3 justify-start gap-2 ${isSelected ? 'border-primary' : ''}`}
                        onClick={() => setSelectedCondition(value as ToothCondition["status"])}
                      >
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: toothConditionColors[value] }}></div>
                        <span>{label}</span>
                      </Button>
                    );
                  })}
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="toothNotes">Notas</Label>
                  <Textarea
                    id="toothNotes"
                    placeholder="Notas específicas sobre este diente"
                    value={toothNotes}
                    onChange={(e) => setToothNotes(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="surfaces" className="space-y-4 pt-4">
                <div className="text-center text-sm text-muted-foreground mb-2">
                  Seleccione las áreas para marcar las superficies afectadas
                </div>
                
                <div className="relative w-48 h-48 mx-auto my-4 border rounded-md bg-white">
                  <svg width="100%" height="100%" viewBox="0 0 100 100">
                    {/* Improved tooth contour for the dialog */}
                    <path 
                      d="M50 10 C65 10, 80 20, 80 45 C80 65, 65 90, 50 90 C35 90, 20 65, 20 45 C20 20, 35 10, 50 10 Z" 
                      fill="white"
                      stroke="#666"
                      strokeWidth="1.5"
                    />
                    
                    {/* Surfaces with improved anatomical accuracy */}
                    <path 
                      d="M35 15 L65 15 C60 25, 40 25, 35 15 Z" 
                      fill={selectedSurfaces?.includes("top") ? toothConditionColors[selectedCondition] : "transparent"}
                      stroke="#ddd"
                      strokeWidth="1"
                      className="cursor-pointer hover:opacity-70"
                      onClick={() => handleSurfaceToggle("top")}
                    />
                    
                    <path 
                      d="M25 35 C25 50, 30 65, 40 80 C35 70, 25 55, 25 35 Z" 
                      fill={selectedSurfaces?.includes("left") ? toothConditionColors[selectedCondition] : "transparent"}
                      stroke="#ddd"
                      strokeWidth="1"
                      className="cursor-pointer hover:opacity-70"
                      onClick={() => handleSurfaceToggle("left")}
                    />
                    
                    <path 
                      d="M75 35 C75 50, 70 65, 60 80 C65 70, 75 55, 75 35 Z" 
                      fill={selectedSurfaces?.includes("right") ? toothConditionColors[selectedCondition] : "transparent"}
                      stroke="#ddd"
                      strokeWidth="1"
                      className="cursor-pointer hover:opacity-70"
                      onClick={() => handleSurfaceToggle("right")}
                    />
                    
                    <path 
                      d="M40 80 L60 80 C55 88, 45 88, 40 80 Z" 
                      fill={selectedSurfaces?.includes("bottom") ? toothConditionColors[selectedCondition] : "transparent"}
                      stroke="#ddd"
                      strokeWidth="1"
                      className="cursor-pointer hover:opacity-70"
                      onClick={() => handleSurfaceToggle("bottom")}
                    />
                    
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="15" 
                      fill={selectedSurfaces?.includes("center") ? toothConditionColors[selectedCondition] : "transparent"}
                      stroke="#ddd"
                      strokeWidth="1"
                      className="cursor-pointer hover:opacity-70"
                      onClick={() => handleSurfaceToggle("center")}
                    />
                    
                    {/* Número de diente */}
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="font-bold">
                      {selectedTooth}
                    </text>
                  </svg>
                </div>
                
                <div className="grid grid-cols-5 gap-2 mt-4">
                  <Button 
                    variant={selectedSurfaces?.includes("top") ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleSurfaceToggle("top")}
                    className="text-xs"
                  >
                    Superior
                  </Button>
                  <Button 
                    variant={selectedSurfaces?.includes("left") ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleSurfaceToggle("left")}
                    className="text-xs"
                  >
                    Izquierda
                  </Button>
                  <Button 
                    variant={selectedSurfaces?.includes("center") ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleSurfaceToggle("center")}
                    className="text-xs"
                  >
                    Centro
                  </Button>
                  <Button 
                    variant={selectedSurfaces?.includes("right") ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleSurfaceToggle("right")}
                    className="text-xs"
                  >
                    Derecha
                  </Button>
                  <Button 
                    variant={selectedSurfaces?.includes("bottom") ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleSurfaceToggle("bottom")}
                    className="text-xs"
                  >
                    Inferior
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="pt-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Historial de tratamientos para este diente
                </div>
                
                {toothHistory.length > 0 ? (
                  <div className="space-y-2">
                    {toothHistory.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 border rounded-md p-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: toothConditionColors[entry.condition] }}></div>
                        <span className="text-sm font-medium">{format(new Date(entry.date), "dd/MM/yyyy")}</span>
                        <span className="text-sm">{toothConditionLabels[entry.condition]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay historial disponible para este diente
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div className="flex items-center">
              <div 
                className="w-6 h-6 rounded-full mr-2" 
                style={{ backgroundColor: toothConditionColors[selectedCondition] }}
              ></div>
              <span>{toothConditionLabels[selectedCondition]}</span>
            </div>
            <div>
              <DialogClose asChild className="mr-2">
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSaveToothCondition}>Guardar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Odontogram;
