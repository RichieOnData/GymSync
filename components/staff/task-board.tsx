"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, CheckCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { supabase } from "@/utils/supabase"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"

interface TaskBoardProps {
  staff: any[]
  tasks?: any[]
  isLoading?: boolean
}

export function TaskBoard({ staff, tasks = [], isLoading = false }: TaskBoardProps) {
  const [localTasks, setLocalTasks] = useState(tasks)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: new Date(),
    priority: "medium",
    status: "todo",
  })

  useEffect(() => {
    if (tasks.length > 0) {
      setLocalTasks(tasks)
    } else {
      fetchTasks()
    }
  }, [tasks])

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase.from("staff_tasks").select("*").order("due_date", { ascending: true })

      if (error) throw error

      setLocalTasks(data || [])
    } catch (err) {
      console.error("Error fetching tasks:", err)
      toast({
        title: "Error",
        description: "Failed to load tasks. Please refresh the page.",
        variant: "destructive",
      })
    }
  }

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find((s) => s.id === staffId)
    return staffMember ? staffMember.name : "Unassigned"
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500">Low</Badge>
      case "medium":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500">Medium</Badge>
      case "high":
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500">High</Badge>
      case "urgent":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500">Urgent</Badge>
      default:
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500">Medium</Badge>
    }
  }

  const getTasksByStatus = (status: string) => {
    return localTasks.filter((task) => task.status === status)
  }

  const handleAddTask = async () => {
    try {
      // Validate inputs
      if (!newTask.title || !newTask.assigned_to || !newTask.due_date) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      // Format date properly for PostgreSQL
      const formattedDate = format(newTask.due_date, "yyyy-MM-dd'T'HH:mm:ss")

      // Insert the task
      const { data, error } = await supabase
        .from("staff_tasks")
        .insert([
          {
            title: newTask.title,
            description: newTask.description,
            assigned_to: newTask.assigned_to,
            due_date: formattedDate,
            priority: newTask.priority,
            status: newTask.status,
          },
        ])
        .select()

      if (error) {
        console.error("Supabase error:", JSON.stringify(error))
        throw error
      }

      // Update local state
      setLocalTasks([...localTasks, ...(data || [])])

      // Close dialog and reset form
      setIsAddTaskOpen(false)
      setNewTask({
        title: "",
        description: "",
        assigned_to: "",
        due_date: new Date(),
        priority: "medium",
        status: "todo",
      })

      toast({
        title: "Task Added",
        description: "New task has been created successfully.",
      })
    } catch (err) {
      console.error("Error adding task:", JSON.stringify(err))
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    // If dropped in the same column and same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    // Get the new status based on the destination droppableId
    const newStatus = destination.droppableId

    // Update the task status locally
    const updatedTasks = localTasks.map((task) => (task.id === draggableId ? { ...task, status: newStatus } : task))

    setLocalTasks(updatedTasks)

    // Update the task status in the database
    try {
      const { error } = await supabase
        .from("staff_tasks")
        .update({
          status: newStatus,
          ...(newStatus === "completed" ? { completion_time: new Date().toISOString() } : {}),
        })
        .eq("id", draggableId)

      if (error) throw error

      toast({
        title: "Task Updated",
        description: `Task status changed to ${newStatus.replace("_", " ")}.`,
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })

      // Revert the local state if the update fails
      setLocalTasks(tasks)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Task Management</h2>
        <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsAddTaskOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* To Do Column */}
          <Droppable droppableId="todo">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <h3 className="font-bold mb-4 flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  To Do ({getTasksByStatus("todo").length})
                </h3>
                <div className="space-y-2 min-h-[200px]">
                  {getTasksByStatus("todo").map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-zinc-800 p-3 rounded-md cursor-pointer hover:bg-zinc-700"
                          onClick={() => {
                            setSelectedTask(task)
                            setIsTaskDetailOpen(true)
                          }}
                        >
                          <h4 className="font-medium mb-2">{task.title}</h4>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-400">{getStaffName(task.assigned_to)}</div>
                            {getPriorityBadge(task.priority)}
                          </div>
                          {task.due_date && (
                            <div className="text-xs text-gray-400 mt-2 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(new Date(task.due_date), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>

          {/* In Progress Column */}
          <Droppable droppableId="in_progress">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <h3 className="font-bold mb-4 flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  In Progress ({getTasksByStatus("in_progress").length})
                </h3>
                <div className="space-y-2 min-h-[200px]">
                  {getTasksByStatus("in_progress").map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-zinc-800 p-3 rounded-md cursor-pointer hover:bg-zinc-700"
                          onClick={() => {
                            setSelectedTask(task)
                            setIsTaskDetailOpen(true)
                          }}
                        >
                          <h4 className="font-medium mb-2">{task.title}</h4>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-400">{getStaffName(task.assigned_to)}</div>
                            {getPriorityBadge(task.priority)}
                          </div>
                          {task.due_date && (
                            <div className="text-xs text-gray-400 mt-2 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(new Date(task.due_date), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>

          {/* Blocked Column */}
          <Droppable droppableId="blocked">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <h3 className="font-bold mb-4 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  Blocked ({getTasksByStatus("blocked").length})
                </h3>
                <div className="space-y-2 min-h-[200px]">
                  {getTasksByStatus("blocked").map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-zinc-800 p-3 rounded-md cursor-pointer hover:bg-zinc-700"
                          onClick={() => {
                            setSelectedTask(task)
                            setIsTaskDetailOpen(true)
                          }}
                        >
                          <h4 className="font-medium mb-2">{task.title}</h4>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-400">{getStaffName(task.assigned_to)}</div>
                            {getPriorityBadge(task.priority)}
                          </div>
                          {task.due_date && (
                            <div className="text-xs text-gray-400 mt-2 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(new Date(task.due_date), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>

          {/* Completed Column */}
          <Droppable droppableId="completed">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <h3 className="font-bold mb-4 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Completed ({getTasksByStatus("completed").length})
                </h3>
                <div className="space-y-2 min-h-[200px]">
                  {getTasksByStatus("completed").map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-zinc-800 p-3 rounded-md cursor-pointer hover:bg-zinc-700"
                          onClick={() => {
                            setSelectedTask(task)
                            setIsTaskDetailOpen(true)
                          }}
                        >
                          <h4 className="font-medium mb-2">{task.title}</h4>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-400">{getStaffName(task.assigned_to)}</div>
                            {task.verification_photo_url && (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500">Verified</Badge>
                            )}
                          </div>
                          {task.completion_time && (
                            <div className="text-xs text-gray-400 mt-2 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              {format(new Date(task.completion_time), "MMM d, yyyy h:mm a")}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new task and assign it to a staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-black border-zinc-800"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="bg-black border-zinc-800 min-h-[100px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select
                value={newTask.assigned_to}
                onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}
              >
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {staff.map((staffMember) => (
                    <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                      {staffMember.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Due Date</Label>
              <DatePicker
                selected={newTask.due_date}
                onSelect={(date) => date && setNewTask({ ...newTask, due_date: date })}
                label="Select due date"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value: string) => setNewTask({ ...newTask, priority: value })}
              >
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleAddTask}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

