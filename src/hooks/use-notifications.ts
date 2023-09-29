import { gql, useMutation } from '@apollo/client'
import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import * as React from 'react'
import { toast } from 'sonner'

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

const GET_SUBSCRIPTION = gql`
  query GetSubscription($endpoint: String!) {
    subscription(endpoint: $endpoint) {
      notificationsAllowed
    }
  }
`

const UPDATE_SUBSCRIPTION = gql`
  mutation UpdateSubscription($endpoint: String!, $allow: Boolean!) {
    updateSubscription(endpoint: $endpoint, allow: $allow) {
      notificationsAllowed
    }
  }
`

// const REMOVE_SUBSCRIPTION = gql``

export const useNotifications = (userToken?: string) => {
  const [permission, setPermission] =
    React.useState<NotificationPermission | null>(null)

  const [allowedByUser, setAllowedByUser] = React.useState(false)

  const [endpoint, setEndpoint] = React.useState('')

  const { refetch: fetchPublicKey } = useQuery(GET_PUBLIC_KEY, { skip: true })

  const { refetch: fetchSubscription } = useQuery<{
    subscription: {
      notificationsAllowed: boolean
    }
  }>(GET_SUBSCRIPTION, {
    context: {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    },
    errorPolicy: 'ignore',
    skip: true,
  })

  const [createSubscription] = useMutation(CREATE_SUBSCRIPTION)

  const [updateSubscription] = useMutation(UPDATE_SUBSCRIPTION, {
    context: {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    },
    onCompleted(data, _clientOptions) {
      setAllowedByUser(data.updateSubscription.notificationsAllowed)
    },
  })

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
      if (subscription) setEndpoint(subscription.endpoint)
      else {
        const { data } = await fetchPublicKey()

        const publickey = data.publicKey

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publickey,
        })
        setEndpoint(subscription.endpoint)
        try {
          const keys = subscription.toJSON().keys

          const { errors } = await createSubscription({
            errorPolicy: 'all',
            context: {
              headers: {
                Authorization: `Bearer ${userToken}`,
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
      const initialNotificationsAllowed = await fetchSubscription({
        endpoint: subscription.endpoint,
      })

      setAllowedByUser(
        initialNotificationsAllowed?.data?.subscription?.notificationsAllowed ??
          false,
      )
    }

    if (Notification.permission === 'granted') registerUserSubscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    endpoint,
    permission,
    allowedByUser,
    updateSubscription,
    requestPermission,
  }
}
