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
  const [teethType, setTeethType] = useState<"adult" | "child">("adult");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

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

  const handlePatientChange = (value: string) => {
    setSelectedPatient(value);
  };

  const loadPatients = () => {
    // Implementation of loadPatients function
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
        <Button variant="outline" onClick={loadPatients} className="h-10">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar Pacientes
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
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
            <Select value={selectedPatient?.id || ''} onValueChange={handlePatientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un paciente" />
              </SelectTrigger>
              <SelectContent>
                {filteredPatients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </SelectItem>
                ))}
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
              <ToggleGroupItem value="child" aria-label="Dientes de niño">
                <Baby className="h-4 w-4 mr-2" />
                Niño
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {selectedPatient ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Odontograma de {selectedPatient.firstName} {selectedPatient.lastName}
              </div>
            </CardTitle>
            <CardDescription>Haga clic en un diente para registrar su condición</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Cargando odontograma...</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Dientes Superiores</h3>
                    <Badge variant="outline" className="ml-2">
                      {teethType === "adult" ? "1-16" : "A-J"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-8 md:grid-cols-16 gap-2">
                    {renderTeeth()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Dientes Inferiores</h3>
                    <Badge variant="outline" className="ml-2">
                      {teethType === "adult" ? "17-32" : "K-T"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-8 md:grid-cols-16 gap-2">
                    {renderTeeth()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-6">
                  {Object.entries(toothConditionColors).map(([condition, color]) => (
                    <div key={condition} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: color }}></div>
                      <span>{condition === "normal" ? "Sano" : 
                             condition === "cavity" ? "Caries" : 
                             condition === "filling" ? "Empaste" : 
                             condition === "crown" ? "Corona" : 
                             condition === "rootCanal" ? "Endodoncia" : 
                             condition === "missing" ? "Ausente" : 
                             condition === "implant" ? "Implante" : condition}</span>
                    </div>
                  ))}
                </div>

                {suggestedTreatments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Tratamientos Sugeridos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {suggestedTreatments.map((treatment, index) => (
                        <Card key={index} className="border border-muted">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base">{treatment.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <div className="flex items-center gap-2 text-sm">
                              <ToothIcon className="h-4 w-4 text-muted-foreground" />
                              <span>Diente{treatment.teeth.length > 1 ? "s" : ""} {treatment.teeth.join(", ")}</span>
                            </div>
                            <div className="text-sm mt-2">{treatment.description}</div>
                            <div className="mt-3 flex justify-end">
                              <Button variant="outline" size="sm">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Agregar Tratamiento
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => {
                    setSuggestedTreatments(generateTreatmentSuggestions());
                  }}>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Sugerir Tratamientos
                  </Button>
                  <Button onClick={saveTeethConditions}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
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

      <ToothConditionDialog
        open={isToothDialogOpen}
        onOpenChange={setIsToothDialogOpen}
        toothNumber={selectedTooth}
        currentCondition={selectedCondition}
        onSave={handleSaveToothCondition}
      />
    </div>
  );
};

// Componente de diálogo para condición del diente
interface ToothConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toothNumber: number | null;
  currentCondition: ToothCondition["status"];
  onSave: () => void;
}

const ToothConditionDialog = ({
  open,
  onOpenChange,
  toothNumber,
  currentCondition,
  onSave
}: ToothConditionDialogProps) => {
  const [condition, setCondition] = useState<ToothCondition["status"]>("healthy");
  const [notes, setNotes] = useState<string>("");
  const [surfaces, setSurfaces] = useState<ToothCondition["surfaces"]>([]);

  // Actualiza los estados locales cuando cambian las props
  useEffect(() => {
    if (open) {
      setCondition(currentCondition);
    }
  }, [open, currentCondition]);

  const handleSurfaceToggle = (surface: "top" | "bottom" | "left" | "right" | "center") => {
    setSurfaces(prev => {
      if (prev?.includes(surface)) {
        return prev.filter(s => s !== surface);
      } else {
        return [...(prev || []), surface];
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Condición del Diente {toothNumber}
          </DialogTitle>
          <DialogDescription>
            Seleccione la condición actual del diente
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="condition">Condición</Label>
            <Select
              value={condition}
              onValueChange={(value) => setCondition(value as ToothCondition["status"])}
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
                variant={surfaces?.includes("top") ? "default" : "outline"} 
                size="sm"
                onClick={() => handleSurfaceToggle("top")}
              >
                Superior
              </Button>
              <Button 
                variant={surfaces?.includes("left") ? "default" : "outline"} 
                size="sm"
                onClick={() => handleSurfaceToggle("left")}
              >
                Izquierda
              </Button>
              <Button 
                variant={surfaces?.includes("center") ? "default" : "outline"} 
                size="sm"
                onClick={() => handleSurfaceToggle("center")}
              >
                Centro
              </Button>
              <Button 
                variant={surfaces?.includes("right") ? "default" : "outline"} 
                size="sm"
                onClick={() => handleSurfaceToggle("right")}
              >
                Derecha
              </Button>
              <Button 
                variant={surfaces?.includes("bottom") ? "default" : "outline"} 
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={onSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Odontogram;
