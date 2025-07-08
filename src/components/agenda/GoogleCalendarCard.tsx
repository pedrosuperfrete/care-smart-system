import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Download, Upload, Unlink2 } from 'lucide-react'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'

export function GoogleCalendarCard() {
  const { 
    isConnected, 
    isLoading, 
    connectToGoogle, 
    disconnect, 
    syncFromGoogle 
  } = useGoogleCalendar()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Google Calendar</CardTitle>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          {isConnected 
            ? 'Seus agendamentos são sincronizados automaticamente com o Google Calendar.'
            : 'Conecte com o Google Calendar para sincronizar seus agendamentos automaticamente.'
          }
        </p>

        <div className="flex flex-wrap gap-2">
          {!isConnected ? (
            <Button 
              onClick={connectToGoogle}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {isLoading ? 'Conectando...' : 'Conectar Google Calendar'}
            </Button>
          ) : (
            <>
              <Button 
                variant="outline"
                onClick={syncFromGoogle}
                disabled={isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                {isLoading ? 'Importando...' : 'Importar do Google'}
              </Button>
              <Button 
                variant="outline"
                onClick={disconnect}
              >
                <Unlink2 className="mr-2 h-4 w-4" />
                Desconectar
              </Button>
            </>
          )}
        </div>

        {isConnected && (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ Sincronização automática ativa
            </p>
            <p className="text-xs text-green-600 mt-1">
              Novos agendamentos serão criados automaticamente no Google Calendar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}