import { type Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Políticas de Privacidade',
}

export default function PrivacyPolitics() {
  return (
    <div className="my-10 space-y-2 px-4 sm:container">
      <h1 className="text-3xl font-bold">
        Política de Privacidade Bench Promos
      </h1>

      <div>
        <p className="text-sm">
          Nosso compromisso é respeitar sua privacidade e garantir o sigilo de
          todas as informações que você nos fornece, através de nosso site{' '}
          <Link href="/">https://www.benchpromos.com</Link>. Por isso, com o
          objetivo de fornecer informações claras e precisas aos Titulares
          acerca do tratamento de dados pessoais, apresentamos nossa política de
          privacidade (“Política de Privacidade”).
        </p>
        <p>
          <strong>
            A NAVEGAÇÃO E USO DESTE SITE SIGNIFICA QUE O USUÁRIO ESTÁ CIENTE DOS
            TERMOS E SERVIÇOS OFERECIDOS NESTA POLÍTICA DE PRIVACIDADE.
          </strong>
        </p>
      </div>

      <div>
        <h2 className="font-semibold">Tratamento dos dados pessoais</h2>
      </div>

      <div className="text-sm">
        <h3 className="text-base font-semibold">1. Coleta e Uso</h3>
        <p>
          1.1. Para seu cadastro, solicitamos informações como nome e e-mail.
        </p>
        <p>
          1.2. Todos os dados cadastrados em nosso site são utilizados apenas
          para melhorar sua experiência de navegação e mantê-lo atualizado sobre
          nossas promoções e vantagens oferecidas pelo site e todos os produtos
          oferecidos pelo Bench Promos e suas empresas parceiras.
        </p>
      </div>

      <div className="text-sm">
        <h3 className="text-base font-semibold">2. Cookies</h3>
        <p>
          2.1. No Bench Promos, o uso de cookies é feito apenas para reconhecer
          um visitante constante e melhorar a experiência de navegação e
          usabilidade. Os cookies são pequenos arquivos de dados transferidos de
          um site da web para o disco do seu computador.
        </p>
      </div>

      <div className="text-sm">
        <h3 className="text-base font-semibold">3. Envio de e-mails</h3>
        <p>
          3.1. Nossos e-mails com promoções têm como remetente o
          noreply@benchpromos.com e são enviados apenas no momento do cadastro.
          Nosso e-mail para atendimento e dúvidas é noreply@benchpromos.com.
        </p>
        <p>
          3.2. Os links de nossos e-mails levam diretamente para o{' '}
          <Link href="/">https://www.benchpromos.com</Link> ou para nossas redes
          sociais.
        </p>
      </div>

      <div className="text-sm">
        <h3 className="text-base font-semibold">4. Segurança da Informação</h3>
        <p>
          4.1. Tomamos medidas de segurança técnicas e organizacionais adequadas
          para protegermos seus dados pessoais contra acesso, alteração,
          divulgação ou ainda destruição não autorizada dos dados. Essas medidas
          incluem análises internas de nossas práticas de coleta, armazenamento
          e processamento de dados e medidas de segurança, incluindo
          criptografia e medidas de segurança física apropriadas para nos
          proteger contra o acesso não autorizado a sistemas em que armazenamos
          os dados pessoais.
        </p>
        <p>
          4.2. Nosso site utiliza uma tecnologia avançada de segurança. Todo o
          tráfego de dados é feito com as informações criptografadas, que é um
          método padrão usado na Internet para proteger as comunicações entre os
          usuários da Web e os sites, fornecendo uma navegação segura.
        </p>
        <p>
          4.3. Limitamos o acesso às informações pessoais aos funcionários,
          contratantes e agentes do Bench Promos que precisam ter conhecimento
          dessas informações para processá-las em nosso nome. Essas pessoas
          estão comprometidas com obrigações de confidencialidade e podem ser
          submetidas a punições, incluindo rescisão de contrato e processo
          criminal, caso não cumpram essas obrigações. O Bench Promos não
          cadastra nenhum usuário sem sua devida permissão.
        </p>
        <p>
          4.4. Após o seu cadastro, o{' '}
          <Link href="/">https://www.benchpromos.com.br</Link> envia um e-mail
          solicitando a confirmação da sua inscrição, e nunca envia e-mails com
          anexos executáveis (extensão exe, com, scr, bat) e links para
          download.
        </p>
        <p>
          4.5. Nunca forneça a senha de seu cadastro a terceiros e, no caso de
          uso não autorizado, acesse imediatamente o Bench Promos e altere sua
          senha em “Esqueceu sua senha?”.
        </p>
      </div>

      <div className="text-sm">
        <h3 className="text-base font-semibold">
          5. Retenção e Término de Dados Pessoais
        </h3>
        <p>
          5.1. O Bench Promos armazena seus dados pessoais pelo tempo exigido
          por lei ou pelo tempo que for necessário para cumprir com sua
          finalidade. Dessa forma, trataremos seus dados, por exemplo, durante
          os prazos prescricionais aplicáveis ou enquanto necessário para
          cumprimento de uma obrigação legal ou regulatória.
        </p>
        <p>
          5.2. O término do tratamento de dados pessoais poderá ocorrer quando o
          Titular exercer seu direito de solicitar o fim do tratamento e a
          exclusão de seus dados pessoais ou quando houver determinação legal
          neste sentido.
        </p>
      </div>

      <div className="text-sm">
        <h3 className="text-base font-semibold">
          6. Direitos dos Titulares dos Dados Pessoais
        </h3>
        <p>
          6.1 A lei de proteção de dados prevê aos Titulares direitos em relação
          aos seus dados pessoais, quais sejam:
        </p>
        <ul>
          <li>
            {' '}
            a) Solicitar o acesso aos dados pessoais e a confirmação da
            existência de tratamento de dados pessoais;
          </li>
          <li>
            {' '}
            b) Solicitar a correção de dados incompletos, inexatos ou
            desatualizados;
          </li>
          <li>
            {' '}
            c) Solicitar a portabilidade dos dados pessoais a outro fornecedor
            de serviço ou produto;
          </li>
          <li>
            {' '}
            d) Solicitar a anonimização ou eliminação dos dados pessoais, em
            circunstâncias específicas;
          </li>
          <li>
            {' '}
            e) Se opor as atividades de tratamento de seus dados pessoais e
            revogar o consentimento, quando o Bench Promos tratar seus dados
            pessoais com base no consentimento.
          </li>
        </ul>
        <p>
          6.2. O consentimento pode ser revogado a qualquer momento pelo Titular
          dos dados para:
        </p>
        <ul>
          <li>
            {' '}
            (i) Deixar de receber alertas: removendo a permissão de receber
            notificações nas configurações do navegador.
          </li>
        </ul>
      </div>

      <div className="text-sm">
        <h3 className="text-base font-semibold">7. Disposições Gerais</h3>
        <p>
          7.1. Esta Política de Privacidade pode ser alterada periodicamente.
          Publicaremos todas as alterações da Política de Privacidade no
          endereço{' '}
          <Link href="/politica-de-privacidade">
            https://www.benchpromos.com/politica-de-privacidade
          </Link>
          , se as alterações forem significativas, colocaremos um aviso com mais
          destaque, incluindo, para alguns serviços, notificação por e-mail das
          alterações da Política de Privacidade.
        </p>
        <p>
          7.2. Esta é a versão da Política de Privacidade, publicada em 30 de
          janeiro de 2024.
        </p>
      </div>
    </div>
  )
}
