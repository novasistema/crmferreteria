import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskItem, TaskPriority, TaskStatus, TaskStep } from '../../types';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Edit2,
  Trash2,
  X,
  Search,
  Check,
  Calendar,
  User,
  ListTodo,
  CheckSquare,
  Square,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const { store, currentUser, showToast } = useApp();
  // Active filter tab: 'all' | 'Pendiente' | 'En Progreso' | 'Completada' | 'general'
  const [filterTab, setFilterTab] = useState<'all' | 'Pendiente' | 'En Progreso' | 'Completada' | 'general'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('Normal');
  const [formStatus, setFormStatus] = useState<TaskStatus>('Pendiente');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('all');
  const [formSteps, setFormSteps] = useState<TaskStep[]>([]);
  const [newStepText, setNewStepText] = useState('');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Compute counters
  const tasks = store.tasks || [];
  const countPending = tasks.filter((t) => t.status === 'Pendiente').length;
  const countInProgress = tasks.filter((t) => t.status === 'En Progreso').length;
  const countCompleted = tasks.filter((t) => t.status === 'Completada').length;
  const countGeneral = tasks.filter((t) => t.assignedTo === 'all').length;
  const countTotal = tasks.length;

  // Available assignees (Users & Employees)
  const allAssignees = [
    { id: 'all', name: 'General (Toda la Empresa)' },
    ...(store.users || []).map((u) => ({ id: u.id, name: `${u.name} (${u.role || 'Usuario'})` })),
    ...(store.employees || []).map((emp) => ({ id: emp.id, name: `${emp.name} (Empleado)` })),
  ];

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterTab === 'Pendiente' && t.status !== 'Pendiente') return false;
    if (filterTab === 'En Progreso' && t.status !== 'En Progreso') return false;
    if (filterTab === 'Completada' && t.status !== 'Completada') return false;
    if (filterTab === 'general' && t.assignedTo !== 'all') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchAssigned = (t.assignedToName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssigned) return false;
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('Normal');
    setFormStatus('Pendiente');
    setFormDueDate('');
    setFormAssignedTo('all');
    setFormSteps([]);
    setNewStepText('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormDueDate(task.dueDate || '');
    setFormAssignedTo(task.assignedTo || 'all');
    setFormSteps(task.steps ? [...task.steps] : []);
    setNewStepText('');
    setIsModalOpen(true);
  };

  const handleAddStepForm = () => {
    if (!newStepText.trim()) return;
    const step: TaskStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: newStepText.trim(),
      completed: false,
    };
    setFormSteps([...formSteps, step]);
    setNewStepText('');
  };

  const handleRemoveStepForm = (stepId: string) => {
    setFormSteps(formSteps.filter((s) => s.id !== stepId));
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Por favor ingrese el título de la tarea o actividad', 'error');
      return;
    }

    const assignedObj = allAssignees.find((a) => a.id === formAssignedTo);
    const assignedName = assignedObj ? assignedObj.name : 'Asignado';

    if (editingTask) {
      store.updateTask(editingTask.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        status: formStatus,
        dueDate: formDueDate,
        assignedTo: formAssignedTo,
        assignedToName: assignedName,
        steps: formSteps,
      });
      showToast('Tarea y pasos actualizados correctamente', 'success');
    } else {
      store.addTask({
        title: formTitle.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        status: formStatus,
        dueDate: formDueDate,
        assignedTo: formAssignedTo,
        assignedToName: assignedName,
        steps: formSteps,
        createdById: currentUser.id,
        createdByName: currentUser.name,
      });
      showToast('¡Tarea creada con pasos y delegada con éxito!', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`¿Desea eliminar la tarea "${title}"?`)) {
      store.deleteTask(id);
      showToast('Tarea eliminada', 'info');
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = store.toggleTaskStatus(id);
    if (updated) {
      showToast(
        updated.status === 'Completada' ? '¡Tarea marcada como Completada!' : 'Tarea reabierta',
        'success'
      );
    }
  };

  const handleToggleStepInline = (taskId: string, stepId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.steps) return;
    const updatedSteps = task.steps.map((s) => (s.id === stepId ? { ...s, completed: !s.completed } : s));
    store.updateTask(taskId, { steps: updatedSteps });
    showToast('Progreso de paso actualizado', 'success');
  };

  const handleNotifyAssignee = (task: TaskItem) => {
    const assigned = task.assignedToName || 'Responsable';
    showToast(`Notificación enviada a ${assigned} vía WhatsApp y Alerta Interna del Sistema`, 'success');
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return 'Sin fecha límite';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString('es-AR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto min-h-full pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-blue-200 dark:border-blue-800">
              <ListTodo className="w-3.5 h-3.5" /> Organización & Delegación Gerencial
            </span>
            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Sincronizado en Firebase
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Gestión de Actividades y Paso a Paso
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organiza las tareas de la empresa, delégalas a tu equipo con instrucciones detalladas, gana tiempo libre para compras y proveedores con seguimiento en tiempo real.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nueva Tarea / Actividad</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Pendientes */}
        <div
          onClick={() => setFilterTab('Pendiente')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
            filterTab === 'Pendiente'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Pendientes</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {countPending}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Por iniciar o asignar</p>
        </div>

        {/* Card 2: En Progreso */}
        <div
          onClick={() => setFilterTab('En Progreso')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
            filterTab === 'En Progreso'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">En Progreso</span>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {countInProgress}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Delegadas y en curso</p>
        </div>

        {/* Card 3: Completadas */}
        <div
          onClick={() => setFilterTab('Completada')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
            filterTab === 'Completada'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Completadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
            {countCompleted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Finalizadas exitosamente</p>
        </div>

        {/* Card 4: Empresa / General */}
        <div
          onClick={() => setFilterTab('general')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
            filterTab === 'general'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Generales / Empresa</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {countGeneral}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sin asignar / Todo el equipo</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `Todas (${countTotal})` },
            { id: 'Pendiente', label: `Pendientes (${countPending})` },
            { id: 'En Progreso', label: `En Progreso (${countInProgress})` },
            { id: 'Completada', label: `Completadas (${countCompleted})` },
            { id: 'general', label: `Generales (${countGeneral})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar tarea, descripción o responsable..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
      </div>

      {/* Tasks Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTasks.map((task) => {
          const isCompleted = task.status === 'Completada';
          const isExpanded = expandedTaskIds[task.id];
          const totalSteps = task.steps?.length || 0;
          const completedSteps = task.steps?.filter((s) => s.completed).length || 0;
          const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : isCompleted ? 100 : 0;

          return (
            <div
              key={task.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                isCompleted
                  ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header: Priority & Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                        task.priority === 'Urgente'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          : task.priority === 'Alta'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : task.priority === 'Normal'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : task.status === 'En Progreso'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(task.id)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                    }`}
                    title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                </div>

                {/* Title & Description */}
                <h3 className={`font-bold text-base text-slate-900 dark:text-white mb-1.5 ${isCompleted ? 'line-through opacity-75' : ''}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {task.description}
                  </p>
                )}

                {/* Assignee & Due Date */}
                <div className="space-y-1.5 py-2.5 border-t border-b border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <User className="w-3.5 h-3.5 text-blue-500" /> Responsable:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {task.assignedToName || 'General'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" /> Fecha límite:
                    </span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatDisplayDate(task.dueDate)}
                    </span>
                  </div>
                </div>

                {/* Steps / Paso a Paso Progress */}
                {totalSteps > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                      >
                        <ListTodo className="w-3.5 h-3.5 text-blue-500" />
                        <span>Paso a Paso ({completedSteps}/{totalSteps})</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{progressPercent}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Expandable Step List */}
                    {isExpanded && (
                      <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {task.steps?.map((step) => (
                          <div
                            key={step.id}
                            onClick={() => handleToggleStepInline(task.id, step.id)}
                            className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={step.completed}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className={`text-xs ${step.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                              {step.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleNotifyAssignee(task)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                  title="Notificar al responsable"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Notificar</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(task)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    title="Editar Tarea"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id, task.title)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No hay tareas o actividades registradas</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Crea tu primera actividad o delega tareas con paso a paso para organizar la empresa y ganar más tiempo libre.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Crear Primera Tarea
          </button>
        </div>
      )}

      {/* Create / Edit Task Modal with Step-by-Step Instructions */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingTask ? 'Editar Tarea / Actividad' : 'Nueva Tarea o Delegación con Paso a Paso'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Organiza las prioridades y asigna responsables para optimizar la operación de la empresa.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título de la Actividad *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Mejorar stock de ferretería y buscar nuevos proveedores"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción o Notas Generales
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el objetivo de esta tarea..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Responsable / Asignado (Delegación)
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    {allAssignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado Actual
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="Completada">Completada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Paso a Paso Checklist Builder */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between">
                  <span>Instrucciones Paso a Paso (Checklist para el responsable)</span>
                  <span className="text-[11px] font-normal text-slate-400">{formSteps.length} pasos añadidos</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ej. 1. Contactar a 3 nuevos proveedores de bulonería..."
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStepForm();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddStepForm}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer"
                  >
                    Agregar Paso
                  </button>
                </div>

                {formSteps.length > 0 && (
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                    {formSteps.map((step, idx) => (
                      <div key={step.id} className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                          <span className="text-slate-800 dark:text-white font-medium">{step.text}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStepForm(step.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingTask ? 'Actualizar Tarea' : 'Guardar y Delegar Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
