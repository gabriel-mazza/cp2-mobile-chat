# Chat Firebase — React Native + Expo

Aplicativo de chat **individual e em grupo** feito com React Native, Expo e TypeScript, usando Firebase (Authentication, Realtime Database, Cloud Firestore e Cloud Messaging). As notificações push são enviadas por uma **API própria hospedada** (Node.js + Express), e os grupos possuem **limite configurável de integrantes protegido contra concorrência**.

## Integrantes

- RM555410 — Gabriel Barros Mazzariol
- RM558497 — Jefferson Junior Alvarez Urbina

## Tecnologias

React Native · Expo · TypeScript (strict, sem `any`) · React Navigation · Firebase JS SDK · expo-notifications · expo-image-picker · Cloudinary (fotos) · API em Node.js + Express + Firebase Admin SDK.

**Versão do Expo:** SDK 55 (`expo ~55.0.0`, React Native 0.83, React 19.2).

## Serviços Firebase e responsabilidades

| Serviço | Responsabilidade |
|---|---|
| **Authentication** | Cadastro e login somente com e-mail e senha, recuperação de sessão (AsyncStorage), identificação por `uid` e logout. |
| **Realtime Database** | **Mensagens** (individuais e de grupo) e listeners em tempo real. Também guarda o espelho `conversationMembers`, usado pelas regras de segurança. |
| **Cloud Firestore** | Perfis (`users`), diretório público com nome e foto (`userDirectory`), grupos (metadados, integrantes, `memberLimit`, política de notificação), conversas individuais, tokens de dispositivo (`users/{uid}/devices`) e log de deduplicação de push (`notificationDeliveries`). |
| **Cloud Messaging (FCM)** | Entrega dos pushes. Android: token FCM nativo, enviado direto pelo Admin SDK. iOS: token do Expo Push Service (entrega via APNs). |
| **Cloudinary** (fora do Firebase) | Armazenamento das fotos de perfil e de grupo. Apenas a URL final (HTTPS) é salva no Firestore. |

### Decisão de arquitetura (validações que dependem dos dois bancos)

As regras do Realtime Database **não conseguem consultar o Firestore**. Por isso:

1. Toda mutação de **grupos** e a criação de **conversas individuais** passam pela API (`/groups`, `/conversations/direct`). Ela grava no Firestore e **espelha os integrantes** em `conversationMembers/{conversationId}/{uid} = true` no Realtime Database. Somente a API escreve nesse caminho.
2. As regras do Realtime Database liberam leitura e escrita de `messages/{conversationId}` somente a quem está nesse espelho. Quem é removido de um grupo perde o acesso.
3. As regras do Firestore **bloqueiam escrita direta** em `groups` e `directConversations`. O limite de integrantes é validado pela API dentro de uma transação.
4. O perfil completo de outro usuário (e-mail, celular, nascimento) só é entregue pela API a quem compartilha uma conversa individual ou um grupo com ele.

## Estrutura do projeto

```
App.tsx
firebaseConfig.json        # configuração do SDK cliente (sem segredos)
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
    routes/    notifications, groups, conversations, users
    services/  firebaseAdmin, recipientResolver, notificationSender,
               notificationDispatcher, groupManager, directConversations, profileAccess
```

## Instalação e execução do app

Pré-requisitos: Node 20+, Android Studio (com Android SDK e um emulador **com Google Play**) e/ou Xcode.

```bash
npm install
cp .env.example .env        # preencha as variáveis (veja abaixo)
npx expo run:android        # gera e instala o development build (gera a pasta android/)
npx expo start --dev-client
npm run typecheck           # tsc --noEmit
```

> O push **não funciona no Expo Go**. Use *development build* (`expo-dev-client`) ou build do EAS (`eas build --profile development`).
>
> No Windows, defina a variável `ANDROID_HOME` (normalmente `C:\Users\<usuario>\AppData\Local\Android\Sdk`) e abra um novo terminal antes de rodar `expo run:android`.

Variáveis do app (`.env`, que **não** é versionado; o modelo está em `.env.example`):

```
EXPO_PUBLIC_API_URL=https://cp2-mobile-chat.onrender.com
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud name do Cloudinary>
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<upload preset unsigned>
```

Depois de alterar o `.env`, reinicie com `npx expo start -c`.

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. **Authentication → Sign-in method:** habilite somente **E-mail/senha**.
3. Crie o **Firestore** (modo de produção) e o **Realtime Database** (modo bloqueado). O Firebase Storage não é usado, pois exige plano Blaze; as fotos ficam no Cloudinary.
4. **Configurações do projeto → Seus apps → Web:** copie a configuração para `firebaseConfig.json` (somente SDK cliente).
5. Publique as regras versionadas neste repositório, pelo console (abas **Regras**) ou pela CLI:
   ```bash
   npm i -g firebase-tools && firebase login
   firebase deploy --only firestore:rules,database
   ```
   O Realtime Database aceita regras em JSON (`database.rules.json`); o Firestore usa o arquivo `firestore.rules`.
6. Registre um app **Android** com o mesmo `android.package` do `app.json` e coloque o `google-services.json` na raiz do projeto (necessário para o FCM).

### Fotos (Cloudinary)

**Serviço escolhido para armazenar imagens: Cloudinary** (o Firebase Storage exige plano Blaze com cartão de crédito).

1. Crie uma conta gratuita em [cloudinary.com](https://cloudinary.com) e anote o **Cloud name**.
2. Em *Settings → Upload → Upload presets*, crie um preset com **Signing mode: Unsigned**, entrega **Upload** e formatos permitidos somente de imagem.
3. Informe o cloud name e o nome do preset no `.env` do app.

O `expo-image-picker` solicita a permissão da galeria. A imagem é enviada ao Cloudinary (`services/storageService.ts`) e apenas a **URL final** é gravada no Firestore. Nenhum segredo fica no app (preset *unsigned*, sem API secret). Quando não há foto, ou ela falha ao carregar, o app mostra uma imagem padrão (iniciais ou ícone de grupo).

## Notificações push

### Android

- Coloque o `google-services.json` na raiz; o `expo prebuild`/`expo run:android` aplica o plugin do Google Services.
- O Android registra o **token FCM nativo** e a API envia direto pelo Firebase Cloud Messaging (Admin SDK).
- A chave da conta de serviço do Admin SDK é usada **somente** na API (variáveis secretas da hospedagem), nunca no app nem no repositório.
- No emulador, use uma imagem do sistema **com Google Play** para receber notificações. Para validar o push, deixe o app do destinatário em segundo plano.

### iOS

- O código usa o token do Expo Push Service (entrega via APNs). Para testar em um iPhone é necessária uma conta Apple Developer: `eas build --profile development --platform ios`, deixando o EAS gerar as chaves APNs, e `extra.eas.projectId` configurado no `app.json` (`eas init`).
- **Limitação:** o fluxo de iOS está implementado, mas não foi testado pela equipe por falta de dispositivo e conta Apple Developer. O simulador de iOS não recebe push.

### Fluxo

1. O app persiste a mensagem no Realtime Database.
2. O app chama `POST /notifications/messages` com `conversationId` e `messageId`, enviando o ID token do Firebase Authentication.
3. A API valida o token, confirma que a mensagem existe e que o `senderId` é o usuário autenticado, lê participantes, política e tokens no Firestore, **calcula os destinatários no servidor** e envia via FCM / Expo Push.
4. O payload de dados contém `conversationId`, `conversationType` e `messageId`. Ao tocar na notificação, o app abre a conversa correspondente.

O texto da notificação é genérico e não inclui o conteúdo da mensagem. Tokens inválidos (`registration-token-not-registered`, `DeviceNotRegistered`) são **desativados** (`enabled: false`). A **idempotência** vem do documento `notificationDeliveries/{conversationId}__{messageId}`, criado com `create()`: reenviar a mesma requisição responde `duplicate` e não notifica de novo.

### Política de notificações (por grupo; definida pelo proprietário)

| Política | Quem recebe push |
|---|---|
| `all_group_messages` | Todos os integrantes, exceto o remetente (mensagens gerais ou direcionadas). |
| `mentioned_members` | Somente mencionados (`mentionedUserIds`) ou o destinatário explícito (`target.memberId`) que ainda sejam integrantes. |
| `direct_messages_only` | Mensagens de grupo **não** geram push. |
| `disabled` | Nenhuma mensagem do grupo gera push. |

Conversas individuais sempre notificam o outro participante. O remetente nunca é notificado e só participantes **atuais** recebem. Testes unitários da lógica de destinatários: `cd server && npm test` (7 casos em `recipientResolver.test.ts`).

## Limite de integrantes e concorrência

- `memberLimit` é definido na criação (inteiro entre 2 e 50) e pode ser alterado pelo proprietário, **nunca abaixo do número atual de integrantes**. A interface mostra `x/limite — N vagas disponíveis` e o aviso de grupo sem vagas.
- A validação existe na **interface** (`utils/groupValidation.ts`) e na **API** (`groupManager.ts`).
- **Concorrência:** adicionar ou remover integrantes e alterar o limite acontece em **uma única transação do Firestore** (`runTransaction`) na API. O Admin SDK usa bloqueio pessimista nas transações, então entradas simultâneas são serializadas: a segunda lê o grupo já atualizado e recebe `GROUP_FULL (409)`. O cliente não escreve em `groups`.
- Após o commit, o espelho do Realtime Database é regravado a partir do estado final do grupo (operação idempotente).

## API de notificações e grupos

**Tecnologia:** Node.js 20 + Express + TypeScript + Firebase Admin SDK (pasta `server/`).

**URL pública (HTTPS):** https://cp2-mobile-chat.onrender.com

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check (sem autenticação): `{"status":"ok"}` |
| POST | `/notifications/messages` | Envia o push de uma mensagem já persistida. Body: `{conversationId, messageId}` |
| POST | `/groups` | Cria grupo (valida limite e usuários) |
| PATCH | `/groups/:groupId` | Proprietário: nome, foto, limite, política, `addMemberIds`, `removeMemberIds` |
| POST | `/groups/:groupId/leave` | Integrante (não proprietário) sai do grupo |
| POST | `/conversations/direct` | Cria ou localiza a conversa individual (`{otherUserId}`) |
| GET | `/users/:uid/profile` | Perfil completo, apenas com conversa ou grupo em comum |

Todas as rotas, exceto `/health`, exigem `Authorization: Bearer <Firebase ID token>`.

**Verificar disponibilidade:**

```bash
curl https://cp2-mobile-chat.onrender.com/health
```

A API é monitorada com um ping periódico em `/health` (UptimeRobot) para não hibernar no plano gratuito do Render.

### Executar localmente

```bash
cd server && npm install
cp .env.example .env   # preencha (apenas local; .env é ignorado pelo git)
npm run dev
```

### Publicar (Render)

1. *New → Web Service* apontando para este repositório, com **Root Directory:** `server`.
2. **Build Command:** `npm install --include=dev && npm run build` · **Start Command:** `npm start` · **Health Check Path:** `/health`.
3. Em *Environment*, defina os **segredos** (somente os nomes constam no repositório): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_DATABASE_URL`.

## Regras de segurança

Versionadas em `firestore.rules` e `database.rules.json`. Resumo:

- **Firestore:** `users` e `devices` só pelo próprio dono (tokens nunca públicos); `userDirectory` (nome e foto) legível por usuários autenticados; `groups` e `directConversations` legíveis só por integrantes e **sem escrita pelo cliente**; `notificationDeliveries` totalmente bloqueado.
- **Realtime Database:** leitura e escrita de mensagens somente para quem está em `conversationMembers/{id}`; `senderId == auth.uid`; `createdAt == now`; texto de 1 a 2000 caracteres; destinatário e menções precisam ser integrantes; mensagens imutáveis (`!data.exists()`).
- **Imagens:** upload *unsigned* ao Cloudinary, restrito pelo preset (somente imagens). A foto é vinculada ao usuário pelo Firestore, cujas regras só permitem ao próprio dono gravar o `photoUrl` do seu perfil.
- **Dados cadastrais** (e-mail, celular, nascimento) de terceiros só são entregues pela API a quem compartilha uma conversa ou um grupo.

## Telas e evidências

| Login | Conversas | Chat (grupo) | Criação de grupo |

| <img width="453" height="981" alt="image" src="https://github.com/user-attachments/assets/db55f990-5da2-4eec-b8c9-3a7bbe6a5ce4" />
 | <img width="453" height="1004" alt="image" src="https://github.com/user-attachments/assets/e16523e3-14ad-4f72-a07a-1be727abbaaa" />
 | <img width="454" height="975" alt="image" src="https://github.com/user-attachments/assets/7840a2b4-d959-4b67-97f0-5eabf5494fb0" />
 | <img width="452" height="1015" alt="image" src="https://github.com/user-attachments/assets/60562b9c-0898-49e5-b8b6-9ef06d25707e" />
 |

Capturas feitas no emulador Android (Android Studio). A tela de **Conversas** mostra uma conversa individual e um grupo com a contagem `2/10 integrantes`; a tela de **Chat** mostra a identificação do autor da mensagem, a seleção de destinatário ("Grupo todo" ou um integrante) e o botão de menção (`@`); a tela de **Criação de grupo** mostra o limite de integrantes, as vagas disponíveis e as quatro políticas de notificação.


## Segurança de credenciais

O `firebaseConfig.json` contém somente a configuração do SDK cliente. As credenciais administrativas (conta de serviço) existem **apenas** nas variáveis secretas da hospedagem da API. Os arquivos `.env.example` (raiz e `server/`) listam somente os nomes das variáveis, com valores fictícios.
