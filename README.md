# Chat Firebase — React Native + Expo

Aplicativo de chat **individual e em grupo** com Firebase (Auth, Realtime Database, Firestore, FCM), notificações push enviadas por uma **API própria hospedada** e grupos com **limite configurável de integrantes protegido contra concorrência**.

## Integrantes

> ⚠️ PREENCHER antes de entregar (nome completo e RM de todos; máximo de 5).

- RM00000 — Nome Completo 1
- RM00000 — Nome Completo 2

## Tecnologias

React Native · Expo · TypeScript (strict, sem `any`) · React Navigation · Firebase JS SDK · expo-notifications · expo-image-picker · API em Node.js + Express + Firebase Admin SDK.

**Versão do Expo:** SDK 55 (`expo ~55.0.0`, React Native 0.83, React 19.2).

## Serviços Firebase e responsabilidades

| Serviço | Responsabilidade |
|---|---|
| **Authentication** | Cadastro/login só com e-mail e senha, recuperação de sessão (AsyncStorage), identificação por `uid`, logout. |
| **Realtime Database** | **Mensagens** (individuais e de grupo) e listeners em tempo real. Também guarda o espelho `conversationMembers` usado pelas regras. |
| **Cloud Firestore** | Perfis (`users`), diretório público (`userDirectory`), grupos (metadados, integrantes, `memberLimit`, política de notificação), conversas individuais, tokens de dispositivo (`users/{uid}/devices`), log de deduplicação de push. |
| **Cloud Messaging (FCM)** | Entrega dos pushes. Android: token FCM nativo enviado direto via Admin SDK. iOS: token Expo (Expo Push Service → APNs). |
| **Cloudinary** (fora do Firebase) | Armazenamento das fotos de perfil e de grupo. Só a URL final (HTTPS) é salva no Firestore. |

### Decisão de arquitetura (validações que dependem dos dois bancos)

As regras do Realtime Database **não conseguem consultar o Firestore**. Por isso:

1. Toda mutação de **grupos** e a criação de **conversas individuais** passam pela API (`/groups`, `/conversations/direct`). Ela grava no Firestore e **espelha os integrantes** em `conversationMembers/{conversationId}/{uid} = true` no Realtime Database (somente a API escreve ali).
2. As regras do Realtime Database liberam leitura/escrita de `messages/{conversationId}` somente a quem está nesse espelho. Quem é removido do grupo perde acesso imediatamente.
3. As regras do Firestore **bloqueiam escrita direta** em `groups` e `directConversations`; o limite de integrantes é validado na API dentro de uma transação.

## Estrutura do projeto

```
App.tsx
firebaseConfig.json        # config do SDK cliente (sem segredos)
firestore.rules  database.rules.json  firebase.json
src/
  components/  Avatar, ChatMessage, ChatInput, ConversationItem, UserItem,
               GroupMemberItem, PolicySelector, FormInput, Loading, ErrorMessage ...
  screens/     Login, Register, Conversations, Users, GroupForm, Chat, Profile, GroupMembers
  services/    firebase, authService, userService, groupService, chatService,
               notificationService, storageService (Cloudinary), imagePickerService, apiClient
  hooks/       useAuth, useUsers, useGroups, useConversations, useConversationInfo,
               useChat, useNotifications
  contexts/    AuthContext
  types/       user, chat, group, notification, navigation
  utils/       conversationId, groupValidation, validators, parsers, errors
server/
  src/
    app.ts  server.ts
    middleware/authenticate.ts
    routes/  notifications, groups, conversations, users
    services/ firebaseAdmin, recipientResolver, notificationSender,
              notificationDispatcher, groupManager, directConversations, profileAccess
```

## Instalação e execução do app

Pré-requisitos: Node 20+, conta Firebase, Android Studio e/ou Xcode (ou EAS Build).

```bash
npm install
cp .env.example .env        # defina EXPO_PUBLIC_API_URL com a URL pública da API
npx expo prebuild           # gera android/ e ios/
npx expo run:android        # development build (Android, dispositivo físico)
npx expo run:ios            # development build (iOS, dispositivo físico)
npx expo start --dev-client
npm run typecheck           # tsc --noEmit
```

> O push **não funciona no Expo Go**; use *development build* (`expo-dev-client`) ou build do EAS (`eas build --profile development`).

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. **Authentication → Sign-in method:** habilite somente **E-mail/senha**.
3. Crie o **Firestore** e o **Realtime Database**. (O Firebase Storage não é usado: exige plano Blaze; as fotos ficam no Cloudinary.)
4. **Configurações do projeto → Seus apps → Web:** copie a configuração para `firebaseConfig.json` (somente SDK cliente).
5. Publique as regras versionadas neste repositório:
   ```bash
   npm i -g firebase-tools && firebase login
   firebase deploy --only firestore:rules,database
   ```
6. Adicione um app **Android** (`br.com.seugrupo.chatfirebase`) e baixe `google-services.json` para a raiz do projeto (necessário para FCM). Ajuste o `package`/`bundleIdentifier` do `app.json` para o seu.

### Fotos (Cloudinary)

**Serviço escolhido para armazenar imagens: Cloudinary** (o Firebase Storage exige plano Blaze com cartão de crédito).

1. Crie uma conta gratuita em [cloudinary.com](https://cloudinary.com) e anote o **Cloud name**.
2. *Settings → Upload → Upload presets → Add upload preset*: **Signing mode: Unsigned**; restrinja a imagens (e, se quiser, limite o tamanho).
3. No `.env` do app: `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` e `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

`expo-image-picker` pede a permissão da galeria; a imagem é enviada ao Cloudinary (`services/storageService.ts`) e apenas a **URL final** vai para o Firestore. Nenhum segredo fica no app (preset *unsigned*; não há API secret). Sem foto (ou se falhar ao carregar), o app exibe imagem padrão (iniciais / ícone de grupo).

## Notificações push

### Android
- `google-services.json` na raiz; `npx expo prebuild` aplica o plugin.
- Em **Configurações do projeto → Contas de serviço**, gere a chave do Admin SDK **somente para a API** (nunca no repositório).
- Para o app usar FCM v1 via EAS (se usar EAS Build/Push), envie a credencial FCM V1 com `eas credentials`.

### iOS
- Requer conta Apple Developer. Faça `eas build --profile development --platform ios` e deixe o EAS gerar as chaves APNs.
- Configure `extra.eas.projectId` no `app.json` (`eas init`).

### Fluxo
1. App persiste a mensagem no Realtime Database.
2. App chama `POST /notifications/messages` com `conversationId` e `messageId` + ID token do Firebase Auth.
3. A API valida o token, confirma que a mensagem existe e que o `senderId` é o usuário autenticado, lê participantes/política/tokens no Firestore, **calcula os destinatários no servidor** e envia via FCM / Expo Push.
4. Payload de dados: `conversationId`, `conversationType`, `messageId`. Ao tocar, o app abre a conversa correspondente.

O texto da notificação é genérico (não inclui o conteúdo da mensagem). Tokens inválidos (`registration-token-not-registered`, `DeviceNotRegistered`) são **desativados** (`enabled: false`). Idempotência: a API cria `notificationDeliveries/{conversationId}__{messageId}` com `create()`; reenvio da mesma requisição responde `duplicate` e não notifica de novo.

### Política de notificações (por grupo; definida pelo proprietário)

| Política | Quem recebe push |
|---|---|
| `all_group_messages` | Todos os integrantes, exceto o remetente (mensagens gerais ou direcionadas). |
| `mentioned_members` | Somente mencionados (`mentionedUserIds`) ou o destinatário explícito (`target.memberId`) que ainda sejam integrantes. |
| `direct_messages_only` | Mensagens de grupo **não** geram push. |
| `disabled` | Nenhuma mensagem do grupo gera push. |

Conversas individuais sempre notificam o outro participante. O remetente nunca é notificado e só participantes **atuais** recebem. Testes: `cd server && npm test` (7 casos em `recipientResolver.test.ts`).

## Limite de integrantes e concorrência

- `memberLimit` definido na criação (inteiro entre 2 e 50) e editável pelo proprietário; **não pode ficar abaixo do número atual de integrantes**. A UI mostra `x/limite — N vagas disponíveis`.
- Validação em duas camadas: **interface** (`utils/groupValidation.ts`) e **API** (`groupManager.ts`).
- **Concorrência:** adicionar/remover integrantes e alterar limite acontece em **uma única transação do Firestore** (`runTransaction`) na API. O Admin SDK usa bloqueio pessimista, então entradas simultâneas são serializadas: a segunda lê o grupo já atualizado e recebe `GROUP_FULL (409)`. O cliente não escreve em `groups`.
- Após o commit, o espelho do Realtime Database é regravado a partir do estado final do grupo (idempotente).

## API de notificações / grupos

**Tecnologia:** Node.js 20 + Express + TypeScript + Firebase Admin SDK (`server/`).

**URL pública (HTTPS):** `https://SUA-API.onrender.com` &nbsp;← _PREENCHER_

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check (sem autenticação): `{"status":"ok"}` |
| POST | `/notifications/messages` | Envia push de uma mensagem já persistida. Body: `{conversationId, messageId}` |
| POST | `/groups` | Cria grupo (valida limite e usuários) |
| PATCH | `/groups/:groupId` | Proprietário: nome, foto, limite, política, `addMemberIds`, `removeMemberIds` |
| POST | `/groups/:groupId/leave` | Integrante (não proprietário) sai do grupo |
| POST | `/conversations/direct` | Cria/localiza conversa individual (`{otherUserId}`) |
| GET | `/users/:uid/profile` | Perfil completo, só com conversa/grupo em comum |

Todas, exceto `/health`, exigem `Authorization: Bearer <Firebase ID token>`.

Verificar disponibilidade: `curl https://SUA-API.onrender.com/health`

### Executar localmente
```bash
cd server && npm install
cp .env.example .env   # preencha (apenas local; .env é ignorado pelo git)
npm run dev
```

### Publicar (exemplo: Render)
1. *New → Web Service* apontando para este repositório, **Root Directory:** `server`.
2. **Build:** `npm install && npm run build` · **Start:** `npm start` · Health check path: `/health`.
3. Em *Environment*, defina os **segredos** (somente os nomes estão no repositório):
   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_DATABASE_URL`.
4. Planos gratuitos hibernam: use um plano que não durma ou um ping em `/health` para a API estar sempre disponível na correção.

## Regras de segurança

Versionadas em `firestore.rules` e `database.rules.json`. Resumo:

- **Firestore:** `users` e `devices` só pelo próprio dono (tokens nunca públicos); `userDirectory` (nome+foto) legível por autenticados; `groups` e `directConversations` legíveis só por integrantes e **sem escrita pelo cliente**; `notificationDeliveries` bloqueado.
- **Realtime Database:** leitura/escrita de mensagens só para quem está em `conversationMembers/{id}`; `senderId == auth.uid`; `createdAt == now`; texto 1–2000 caracteres; destinatário e menções devem ser integrantes; mensagens imutáveis (`!data.exists()`).
- **Imagens:** upload *unsigned* ao Cloudinary, restrito pelo preset (somente imagens). O vínculo foto↔usuário é feito pelo Firestore, cujas regras só deixam o próprio dono gravar `photoUrl` no seu perfil.
- Dados cadastrais (e-mail, celular, nascimento) de terceiros só são entregues pela API a quem compartilha conversa/grupo.

## Telas / evidências

> PREENCHER: coloque as imagens em `docs/prints/` e referencie abaixo.

| Login / Cadastro | Conversas | Chat | Grupo | Perfil |
|---|---|---|---|---|
| ![](docs/prints/login.png) | ![](docs/prints/conversas.png) | ![](docs/prints/chat.png) | ![](docs/prints/grupo.png) | ![](docs/prints/perfil.png) |

**Evidência de notificação recebida:** ![](docs/prints/push.png)

## Segurança de credenciais

`firebaseConfig.json` contém só a configuração do SDK cliente. Credenciais administrativas existem **apenas** nas variáveis secretas da hospedagem da API. `.env.example` (app e `server/`) lista só nomes de variáveis.
