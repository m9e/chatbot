'use server'

import { revalidatePath } from 'next/cache'

interface Deployment {
  m_name: string
  instances: Array<{ host_name: string }>
  lb_port: number
  status: string
}

/**
 * Fetches the list of available Kamiwaza deployments from the API.
 * 
 * @returns An array of Deployment objects representing available models.
 */
export async function getKamiwazaDeployments() {
  try {
    const kamiwazaApiUri = process.env.KAMIWAZA_API_URI
    if (!kamiwazaApiUri) {
      throw new Error('KAMIWAZA_API_URI is not defined')
    }

    const response = await fetch(`${kamiwazaApiUri}/api/serving/deployments`, {
      next: { revalidate: 10 } // Revalidate every 10 seconds to ensure up-to-date deployment information
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch deployments')
    }

    const data = await response.json()
    // Filter to only include deployed models
    const filteredDeployments = data.filter((d: Deployment) => d.status === 'DEPLOYED')

    revalidatePath('/') // Revalidate the home page to reflect any changes in available models

    return filteredDeployments
  } catch (error) {
    console.error('Error fetching deployments:', error)
    return []
  }
}

/**
 * Prepares the selected Kamiwaza model information for client-side use.
 * 
 * This function doesn't perform any server-side selection logic. Instead, it
 * packages the information about the selected model (which was chosen client-side)
 * for use in subsequent API calls.
 * 
 * @param baseUrl The base URL of the selected model's API endpoint.
 * @param modelName The name of the selected model.
 * @returns An object containing the baseUrl and modelName of the selected model.
 */
export async function selectKamiwazaModel(baseUrl: string, modelName: string) {
  // No server-side logic is performed here.
  // This function simply returns the model information as provided.
  // The actual selection happens on the client side in the ModelSelector component.
  
  // In a more complex scenario, you might want to log the selection,
  // update user preferences, or perform other non-critical operations here.

  console.log(`Model selected: ${modelName} at ${baseUrl}`)

  return { baseUrl, modelName }
}