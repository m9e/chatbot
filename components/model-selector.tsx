'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getKamiwazaDeployments, selectKamiwazaModel } from '@/app/kamiwaza/actions'
import { ModelInfo } from '@/lib/types'
import { updateChatWithSelectedModel } from '@/app/actions'
import { useAIState } from 'ai/rsc'
import { getDockerizedUrl } from '@/lib/utils'

interface Deployment {
  m_name: string
  instances: Array<{ host_name: string }>
  lb_port: number
}

interface ModelSelectorProps {
  onModelSelect: (modelInfo: ModelInfo | null) => void
}

export function ModelSelector({ onModelSelect }: ModelSelectorProps) {
  const [aiState] = useAIState()
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')

  // Fetch deployments and handle initial setup
  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        const fetchedDeployments = await getKamiwazaDeployments()
        setDeployments(fetchedDeployments)

        if (fetchedDeployments.length > 0 && !selectedModel && !aiState.selectedModel) {
          const firstDeployment = fetchedDeployments[0]
          const baseUrl = getDockerizedUrl(
            `http://${firstDeployment.instances[0].host_name}:${firstDeployment.lb_port}/v1`
          )
          const modelInfo = {
            baseUrl,
            modelName: firstDeployment.m_name
          }
          
          setSelectedModel(firstDeployment.m_name)
          onModelSelect(modelInfo)
        }
      } catch (error) {
        console.error('Failed to fetch deployments:', error)
      }
    }

    fetchDeployments()
  }, []) // Empty dependency array - only run once on mount

  // Sync with aiState selected model
  useEffect(() => {
    if (aiState.selectedModel && deployments.length > 0) {
      const deployment = deployments.find(d => d.m_name === aiState.selectedModel?.modelName)
      if (deployment && deployment.m_name !== selectedModel) {
        setSelectedModel(deployment.m_name)
      }
    }
  }, [aiState.selectedModel?.modelName, deployments.length]) // Only depend on model name and deployments length

  const handleModelChange = async (modelName: string) => {
    let baseUrl: string
    let modelInfo: ModelInfo

    const selectedDeployment = deployments.find(d => d.m_name === modelName)
    if (selectedDeployment) {
      baseUrl = getDockerizedUrl(`http://${selectedDeployment.instances[0].host_name}:${selectedDeployment.lb_port}/v1`)
      modelInfo = { baseUrl, modelName }
    } else {
      console.error('Selected deployment not found')
      return
    }

    setSelectedModel(modelName)
    onModelSelect(modelInfo)

    try {
      await selectKamiwazaModel(modelInfo.baseUrl, modelInfo.modelName)
      if (aiState.chatId) {
        await updateChatWithSelectedModel(aiState.chatId, modelInfo)
      }
      console.log('Model selected and saved:', modelInfo)
    } catch (error) {
      console.error('Failed to save selected model:', error)
    }
  }

  if (deployments.length === 0) {
    return null
  }

  return (
    <Select onValueChange={handleModelChange} value={selectedModel || undefined}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a model">
          {selectedModel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {deployments.map(deployment => (
          <SelectItem key={deployment.m_name} value={deployment.m_name}>
            {deployment.m_name} (Port: {deployment.lb_port})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}