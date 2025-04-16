"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock } from "lucide-react"
import type { PeakHourForecast } from "@/utils/ai-insights"

interface PeakHourCardProps {
  forecast: PeakHourForecast[]
}

export function PeakHourCard({ forecast }: PeakHourCardProps) {
  const [selectedDay, setSelectedDay] = useState(forecast[0]?.day || "Monday")

  const currentForecast = forecast.find((f) => f.day === selectedDay) || forecast[0]

  if (!currentForecast) return null

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Peak Hour Forecast</CardTitle>
        <CardDescription>Predicted gym occupancy by hour</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={selectedDay} onValueChange={setSelectedDay} className="w-full">
          <TabsList className="grid grid-cols-7 mb-4 bg-zinc-800 border border-zinc-700">
            {forecast.map((day) => (
              <TabsTrigger key={day.day} value={day.day} className="text-xs">
                {day.day.substring(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedDay} className="mt-0">
            <div className="space-y-4">
              {/* Occupancy Heatmap */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Hourly Occupancy</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-400">Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-xs text-gray-400">Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-xs text-gray-400">High</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-9 gap-1">
                  {currentForecast.hourlyData.map((hourData) => {
                    // Determine color based on occupancy
                    let bgColor = "bg-green-500/20"
                    if (hourData.occupancyPercentage > 70) bgColor = "bg-red-500/20"
                    else if (hourData.occupancyPercentage > 40) bgColor = "bg-yellow-500/20"

                    return (
                      <div
                        key={hourData.hour}
                        className={`p-2 rounded ${bgColor} text-center`}
                        title={`${hourData.occupancyPercentage}% occupancy (${hourData.memberCount} members)`}
                      >
                        <div className="text-xs font-medium">{hourData.hour}</div>
                        <div className="text-xs">{hourData.occupancyPercentage}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Peak Hours */}
              {currentForecast.peakHours.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Peak Hours:</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentForecast.peakHours.map((hour) => (
                      <Badge key={hour} variant="outline" className="bg-red-500/10 text-red-500 border-red-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {hour}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Actions */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Suggested Actions:</h4>
                <ul className="space-y-1">
                  {currentForecast.suggestedActions.map((action, index) => (
                    <li key={index} className="text-sm text-gray-400 flex items-start">
                      <AlertTriangle className="h-3.5 w-3.5 mr-2 mt-0.5 text-yellow-500" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

