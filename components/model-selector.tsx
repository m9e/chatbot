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
  const [fixedModel, setFixedModel] = useState<ModelInfo | null>(null)

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        const fetchedDeployments = await getKamiwazaDeployments()
        setDeployments(fetchedDeployments)

        // Fetch fixed model information
        const response = await fetch('/api/fixed-model')
        const fixedModelData = await response.json()
        if (fixedModelData.uri && fixedModelData.name) {
          setFixedModel({
            baseUrl: fixedModelData.uri,
            modelName: fixedModelData.name
          })
        }

        // Select fixed model by default if available, otherwise select first deployment
        if (fixedModelData.uri && fixedModelData.name) {
          handleModelChange(fixedModelData.name)
        } else if (fetchedDeployments.length > 0) {
          handleModelChange(fetchedDeployments[0].m_name)
        }
      } catch (error) {
        console.error('Failed to fetch deployments:', error)
      }
    }

    fetchDeployments()
  }, [])

  const handleModelChange = async (modelName: string) => {
    if (fixedModel && modelName === fixedModel.modelName) {
      setSelectedModel(modelName)
      onModelSelect(fixedModel)
    } else {
      const selectedDeployment = deployments.find(d => d.m_name === modelName)
      if (selectedDeployment) {
        const baseUrl = `http://${selectedDeployment.instances[0].host_name}:${selectedDeployment.lb_port}/v1`
        await selectKamiwazaModel(baseUrl, modelName)
        setSelectedModel(modelName)
        onModelSelect({ baseUrl, modelName })
      }
    }
    console.log('Model selected:', { modelName });
  }

  if (deployments.length === 0 && !fixedModel) {
    return null
  }

  return (
    <Select onValueChange={handleModelChange} value={selectedModel || undefined}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {fixedModel && (
          <SelectItem key={fixedModel.modelName} value={fixedModel.modelName}>
            {fixedModel.modelName} (Fixed)
          </SelectItem>
        )}
        {deployments.map(deployment => (
          <SelectItem key={deployment.m_name} value={deployment.m_name}>
            {deployment.m_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
