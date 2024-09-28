'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getKamiwazaDeployments, selectKamiwazaModel } from '@/app/kamiwaza/actions'
import { ModelInfo } from '@/lib/types'

interface Deployment {
  m_name: string
  instances: Array<{ host_name: string }>
  lb_port: number
}

interface ModelSelectorProps {
  onModelSelect: (modelInfo: ModelInfo | null) => void
}

export function ModelSelector({ onModelSelect }: ModelSelectorProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        const fetchedDeployments = await getKamiwazaDeployments()
        setDeployments(fetchedDeployments)

        if (fetchedDeployments.length === 1) {
          const deployment = fetchedDeployments[0]
          handleModelChange(deployment.m_name)
        }
      } catch (error) {
        console.error('Failed to fetch deployments:', error)
      }
    }

    fetchDeployments()
  }, [])

  const handleModelChange = async (modelName: string) => {
    const selectedDeployment = deployments.find(d => d.m_name === modelName)
    if (selectedDeployment) {
      const baseUrl = `http://${selectedDeployment.instances[0].host_name}:${selectedDeployment.lb_port}/v1`
      await selectKamiwazaModel(baseUrl, modelName)
      setSelectedModel(modelName)
      onModelSelect({ baseUrl, modelName })
      console.log('Model selected:', { baseUrl, modelName });  // Add this line
    }
  }

  if (deployments.length === 0) {
    return null
  }

  return (
    <Select onValueChange={handleModelChange} value={selectedModel || undefined}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {deployments.map(deployment => (
          <SelectItem key={deployment.m_name} value={deployment.m_name}>
            {deployment.m_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
