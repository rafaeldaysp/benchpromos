import { gql, useMutation } from '@apollo/client'
import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import * as React from 'react'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'

const GET_PUBLIC_KEY = gql`
  query Query {
    publicKey
  }
`

const CREATE_SUBSCRIPTION = gql`
  mutation CreateSubscription($input: CreateSubscriptionInput!) {
    createSubscription(createSubscriptionInput: $input) {
      id
    }
  }
`

// const REMOVE_SUBSCRIPTION = gql``

export const useNotifications = () => {
  const [permission, setPermission] =
    React.useState<NotificationPermission | null>(null)

  const { refetch: fetchPublicKey } = useQuery(GET_PUBLIC_KEY, { skip: true })

  const [createSubscription] = useMutation(CREATE_SUBSCRIPTION)

  React.useEffect(() => {
    setPermission(Notification.permission)
  }, [])

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (!registration) {
          navigator.serviceWorker
            .register('/push-service-worker.js', { scope: '/' })
            .then(() => {
              console.log('Service Worker registrado com sucesso.')
            })
            .catch((error) => {
              console.error('Erro ao registrar o Service Worker:', error)
            })
        } else {
          console.log('Service Worker já está registrado.')
        }
      })
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações push.')

      return
    }

    const permissionStatus = await Notification.requestPermission()
    setPermission(permissionStatus)
  }

  React.useEffect(() => {
    async function registerUserSubscription() {
      const registration = await navigator.serviceWorker.ready

      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        const token = await getCurrentUserToken()

        const { data } = await fetchPublicKey()

        const publickey = data.publicKey

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publickey,
        })

        try {
          const keys = subscription.toJSON().keys

          const { errors } = await createSubscription({
            errorPolicy: 'all',
            context: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
            variables: {
              input: {
                endpoint: subscription.endpoint,
                keys,
              },
            },
          })

          if (errors) {
            toast.error(errors[0].message)

            return
          }

          toast.message(
            'Tudo pronto! Você começará a receber nossas notificações.',
          )
        } catch {
          toast.error(
            'Houve um problema ao ativar as notificações. Por favor, recarregue a página e tente novamente.',
          )
        }
      }
    }

    if (Notification.permission === 'granted') registerUserSubscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    permission,
    requestPermission,
  }
}
