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
import { Save, User, AlertCircle, Baby, ChevronDown, ChevronUp, Search } from "lucide-react";
import { format } from "date-fns";
import { patientService, Patient, odontogramService, Treatment, treatmentService } from "@/lib/data-service";
import ToothIcon from "@/components/icons/ToothIcon";

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
  healthy: "white",
  caries: "#ffcc00",
  filling: "#e0e0e0",
  crown: "#ffd700",
  extraction: "#ff6b6b",
  implant: "#4dabf7",
  "root-canal": "#40c057",
};

const toothConditionLabels: Record<string, string> = {
  healthy: "Sano",
  caries: "Caries",
  filling: "Empaste",
  crown: "Corona",
  extraction: "Extracción",
  implant: "Implante",
  "root-canal": "Tratamiento de Conducto",
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
        
        const patientsData = await patientService.getAll();
        setPatients(patientsData);
        
        // Load recent patients
        const recentPatientsData = await patientService.getRecent(10);
        setRecentPatients(recentPatientsData);
        
        if (selectedPatient) {
          const patient = patientsData.find(p => p.id === selectedPatient);
          setCurrentPatient(patient || null);
          
          if (patient) {
            setIsPediatric(!!patient.isPediatric);
            
            if (isViewMode) {
              const patientOdontograms = await odontogramService.getByPatientId(selectedPatient);
              const odontogram = patientOdontograms.find(o => o.date === selectedDate);
              
              if (odontogram) {
                setTeethConditions(odontogram.teeth);
                setGeneralNotes(odontogram.notes);
                setIsPediatric(!!odontogram.isPediatric);
              } else {
                toast({
                  title: "Error",
                  description: "No se encontró el odontograma para la fecha seleccionada",
                  variant: "destructive",
                });
                setIsViewMode(false);
              }
            } else {
              const patientOdontograms = await odontogramService.getByPatientId(selectedPatient);
              const todayOdontogram = patientOdontograms.find(o => o.date === selectedDate);
              
              if (todayOdontogram) {
                setTeethConditions(todayOdontogram.teeth);
                setGeneralNotes(todayOdontogram.notes);
                setIsPediatric(!!todayOdontogram.isPediatric);
                toast({
                  title: "Odontograma cargado",
                  description: "Se ha cargado un odontograma existente para la fecha seleccionada",
                });
              } else {
                setTeethConditions({});
                setGeneralNotes("");
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedPatient, selectedDate, isViewMode, toast]);

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

  const renderTeeth = () => {
    const teethToRender = isPediatric ? allPediatricTeeth : allAdultTeeth;
    
    return teethToRender.map((tooth) => {
      const condition = teethConditions[tooth.number];
      const fillColor = condition ? toothConditionColors[condition.status] : "white";
      const isSelected = selectedTooth === tooth.number;
      const hasSurfaces = condition && condition.surfaces && condition.surfaces.length > 0;
      
      return (
        <g key={tooth.number} onClick={() => handleToothClick(tooth.number)}>
          <circle
            cx={tooth.x}
            cy={tooth.y}
            r={15}
            className={`tooth ${isSelected ? "tooth-selected" : ""} ${condition ? `tooth-${condition.status}` : ""}`}
            style={{ 
              fill: hasSurfaces ? "white" : fillColor, 
              cursor: isViewMode ? "default" : "pointer",
              stroke: "#000",
              strokeWidth: isSelected ? 2 : 1,
              strokeDasharray: condition?.status === "extraction" ? "2,2" : "none"
            }}
          />
          
          {hasSurfaces && (
            <>
              {condition.surfaces?.includes("top") && (
                <path
                  d={`M${tooth.x},${tooth.y - 15} A15,15 0 0,1 ${tooth.x},${tooth.y - 15} Z`}
                  style={{ fill: fillColor }}
                />
              )}
              {condition.surfaces?.includes("bottom") && (
                <path
                  d={`M${tooth.x - 15},${tooth.y} A15,15 0 0,0 ${tooth.x + 15},${tooth.y} L${tooth.x},${tooth.y + 15} Z`}
                  style={{ fill: fillColor }}
                />
              )}
              {condition.surfaces?.includes("left") && (
                <path
                  d={`M${tooth.x},${tooth.y} L${tooth.x - 15},${tooth.y - 10} L${tooth.x - 15},${tooth.y + 10} Z`}
                  style={{ fill: fillColor }}
                />
              )}
              {condition.surfaces?.includes("right") && (
                <path
                  d={`M${tooth.x},${tooth.y} L${tooth.x + 15},${tooth.y - 10} L${tooth.x + 15},${tooth.y + 10} Z`}
                  style={{ fill: fillColor }}
                />
              )}
              {condition.surfaces?.includes("center") && (
                <circle
                  cx={tooth.x}
                  cy={tooth.y}
                  r={7}
                  style={{ fill: fillColor }}
                />
              )}
            </>
          )}
          
          <text
            x={tooth.x}
            y={tooth.y + 5}
            textAnchor="middle"
            fontSize="10"
            fill="#333"
            pointerEvents="none"
          >
            {tooth.number}
          </text>
          
          {condition?.notes && (
            <text
              x={tooth.x + 13}
              y={tooth.y - 13}
              textAnchor="middle"
              fontSize="8"
              fill="#333"
              pointerEvents="none"
            >
              *
            </text>
          )}
        </g>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Odontograma</h1>
        <div className="flex gap-2">
          {!isViewMode && (
            <Button onClick={handleSaveOdontogram} disabled={!selectedPatient || isLoading}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Odontograma
            </Button>
          )}
          {isViewMode && (
            <Button variant="outline" onClick={() => navigate(-1)}>
              Volver
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPediatric && <Baby className="h-5 w-5 text-pink-500" />}
            {isViewMode ? "Visualizar Odontograma" : "Crear Nuevo Odontograma"}
          </CardTitle>
          <CardDescription>
            {isViewMode
              ? "Visualización de odontograma existente"
              : "Seleccione un paciente y registre el estado de sus dientes"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente</Label>
              <div className="relative">
                <div className="border rounded-md p-2">
                  {selectedPatient ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                          {currentPatient ? currentPatient.firstName.charAt(0) + currentPatient.lastName.charAt(0) : '??'}
                        </div>
                        <div>
                          <p className="font-medium">{currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : 'Paciente seleccionado'}</p>
                          {currentPatient && (
                            <p className="text-xs text-muted-foreground">
                              {currentPatient.phone || currentPatient.email}
                            </p>
                          )}
                        </div>
                      </div>
                      {!isViewMode && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPatient("")}>
                          Cambiar
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="pl-9" 
                          placeholder="Buscar paciente por nombre..."
                          onChange={(e) => {
                            const searchText = e.target.value.toLowerCase();
                            const filtered = document.querySelectorAll('[data-patient-card]');
                            filtered.forEach(card => {
                              const name = card.getAttribute('data-name')?.toLowerCase() || '';
                              if (name.includes(searchText)) {
                                card.classList.remove('hidden');
                              } else {
                                card.classList.add('hidden');
                              }
                            });
                          }}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        {recentPatients.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Pacientes recientes</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {recentPatients.slice(0, 6).map(patient => (
                                <div
                                  key={`recent-${patient.id}`}
                                  data-patient-card
                                  data-name={`${patient.firstName} ${patient.lastName}`}
                                  className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent transition-colors cursor-pointer"
                                  onClick={() => {
                                    setSelectedPatient(patient.id);
                                    const foundPatient = patients.find(p => p.id === patient.id);
                                    if (foundPatient) {
                                      setCurrentPatient(foundPatient);
                                      setIsPediatric(!!foundPatient.isPediatric);
                                    }
                                  }}
                                >
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                    {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                                  </div>
                                  <div className="overflow-hidden">
                                    <p className="font-medium truncate">{patient.firstName} {patient.lastName}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {patient.isPediatric && <Baby className="inline h-3 w-3 text-pink-500 mr-1" />}
                                      {patient.lastVisit ? `Última visita: ${format(new Date(patient.lastVisit), "dd/MM/yyyy")}` : "Sin visitas previas"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Todos los pacientes</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto p-1">
                            {patients.map(patient => (
                              <div
                                key={patient.id}
                                data-patient-card
                                data-name={`${patient.firstName} ${patient.lastName}`}
                                className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent transition-colors cursor-pointer"
                                onClick={() => {
                                  setSelectedPatient(patient.id);
                                  setCurrentPatient(patient);
                                  setIsPediatric(!!patient.isPediatric);
                                }}
                              >
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                  {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="font-medium truncate">{patient.firstName} {patient.lastName}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {patient.isPediatric && <Baby className="inline h-3 w-3 text-pink-500 mr-1" />}
                                    {patient.lastVisit ? `Última visita: ${format(new Date(patient.lastVisit), "dd/MM/yyyy")}` : "Sin visitas previas"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Odontograma</Label>
              <Select
                value={isPediatric ? "pediatric" : "adult"}
                onValueChange={(value) => setIsPediatric(value === "pediatric")}
                disabled={isViewMode || (currentPatient && currentPatient.isPediatric !== undefined)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adult">Adulto (32 dientes)</SelectItem>
                  <SelectItem value="pediatric">Pediátrico (20 dientes)</SelectItem>
                </SelectContent>
              </Select>
              {currentPatient && currentPatient.isPediatric !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Tipo determinado automáticamente según el perfil del paciente
                </p>
              )}
            </div>
          </div>

          {selectedPatient ? (
            <>
              <div className="border rounded-lg p-4 overflow-x-auto">
                <svg width={isPediatric ? "680" : "680"} height="200" viewBox={`0 0 ${isPediatric ? "680" : "680"} 200`}>
                  <path
                    d={isPediatric 
                      ? "M140,80 Q340,180 540,80 Q340,220 140,80" 
                      : "M20,80 Q340,180 660,80 Q340,220 20,80"}
                    fill="none"
                    stroke="#ddd"
                    strokeWidth="1"
                  />
                  
                  {renderTeeth()}
                </svg>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Leyenda</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(toothConditionColors).map(([condition, color]) => (
                    <div key={condition} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color, border: "1px solid #ccc" }}
                      ></div>
                      <span className="text-sm">{toothConditionLabels[condition]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Generales</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales sobre el odontograma"
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  readOnly={isViewMode}
                  rows={4}
                />
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center py-12">
              <div className="text-center text-muted-foreground">
                <User className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p>Por favor seleccione un paciente para continuar</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {!isViewMode && (
            <div className="text-sm text-muted-foreground">
              Haga clic en un diente para registrar su condición
            </div>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isToothDialogOpen} onOpenChange={setIsToothDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Condición del Diente {selectedTooth}
            </DialogTitle>
            <DialogDescription>
              Seleccione la condición actual del diente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Condición</Label>
              <Select
                value={selectedCondition}
                onValueChange={(value) => setSelectedCondition(value as ToothCondition["status"])}
              >
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Seleccione una condición" />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-[50vh]">
                  {Object.entries(toothConditionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Superficies Afectadas</Label>
              <div className="grid grid-cols-5 gap-2 p-4 border rounded-md">
                <Button 
                  variant={selectedSurfaces?.includes("top") ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleSurfaceToggle("top")}
                >
                  Superior
                </Button>
                <Button 
                  variant={selectedSurfaces?.includes("left") ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleSurfaceToggle("left")}
                >
                  Izquierda
                </Button>
                <Button 
                  variant={selectedSurfaces?.includes("center") ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleSurfaceToggle("center")}
                >
                  Centro
                </Button>
                <Button 
                  variant={selectedSurfaces?.includes("right") ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleSurfaceToggle("right")}
                >
                  Derecha
                </Button>
                <Button 
                  variant={selectedSurfaces?.includes("bottom") ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleSurfaceToggle("bottom")}
                >
                  Inferior
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="toothNotes">Notas</Label>
              <Textarea
                id="toothNotes"
                placeholder="Notas específicas sobre este diente"
                value={toothNotes}
                onChange={(e) => setToothNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveToothCondition}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTreatmentDialogOpen} onOpenChange={setIsTreatmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Tratamientos Sugeridos
            </DialogTitle>
            <DialogDescription>
              Basados en el odontograma, se sugieren los siguientes tratamientos
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {suggestedTreatments.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm">
                  Hemos identificado {suggestedTreatments.length} posibles tratamientos basados en 
                  las condiciones de los dientes registradas:
                </p>
                
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Diente</TableHead>
                        <TableHead>Condición</TableHead>
                        <TableHead>Tratamiento</TableHead>
                        <TableHead className="text-right">Costo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suggestedTreatments.map((treatment) => (
                        <TableRow key={treatment.toothNumber}>
                          <TableCell className="font-medium">{treatment.toothNumber}</TableCell>
                          <TableCell>{toothConditionLabels[treatment.condition.status]}</TableCell>
                          <TableCell>{treatment.treatmentType}</TableCell>
                          <TableCell className="text-right">${treatment.cost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <p className="text-sm">
                  ¿Desea crear estos tratamientos automáticamente? También puede cerrar
                  este diálogo y crearlos manualmente más tarde.
                </p>
              </div>
            ) : (
              <p>No se encontraron tratamientos sugeridos basados en el odontograma.</p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTreatmentDialogOpen(false)}>
              Ahora No
            </Button>
            <Button onClick={handleCreateTreatments}>
              Crear Tratamientos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Odontogram;
