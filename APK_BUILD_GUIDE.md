# 📦 MultiFit — Guia de Build para Play Store / App Store

## 1) Pré-requisitos

- Node 18+ e `npm`
- **Android**: Android Studio (com SDK Platform-Tools, JDK 17+)
- **iOS**: Mac com Xcode 15+, conta Apple Developer ($99/ano)
- Exportar o projeto pra um repositório GitHub seu (botão **Export to GitHub** no Lovable)

## 2) Setup local (uma vez)

```bash
git clone https://github.com/SEU_USUARIO/multifit.git
cd multifit
npm install
npx cap add android        # adiciona pasta android/
npx cap add ios            # opcional, só no Mac
```

## 3) Build de produção (cada release)

**Importante**: o `capacitor.config.json` aponta para o sandbox do Lovable (hot-reload). Para gerar APK/AAB de produção que rode **offline com os assets bundlados**, use o config alternativo:

```bash
# 1. Use o config de produção (sem server.url)
cp capacitor.config.prod.json capacitor.config.json

# 2. Build do front
npm run build

# 3. Sincroniza assets para os projetos nativos
npx cap sync

# 4a. Android — abre Android Studio
npx cap open android
#   Em Android Studio: Build → Generate Signed Bundle / APK → Android App Bundle (.aab)
#   Use o keystore que vc criou (guardar com vida!)

# 4b. iOS (Mac apenas)
npx cap open ios
#   Em Xcode: Product → Archive → Distribute App → App Store Connect
```

> Depois do release, restaure o `capacitor.config.json` original (`git checkout capacitor.config.json`) para voltar ao hot-reload em desenvolvimento.

## 4) Assinatura Android (uma vez)

```bash
keytool -genkey -v -keystore multifit.keystore \
  -alias multifit -keyalg RSA -keysize 2048 -validity 10000
```
Guarde `multifit.keystore` + senha **em local seguro** — sem isso você não consegue mais publicar updates.

## 5) Publicar

### Google Play Console
1. Console → Criar app → **MultiFit**
2. Upload do `.aab` gerado
3. Preencher: descrição, screenshots (mínimo 2), ícone 512x512, política de privacidade (URL pública obrigatória)
4. Categoria: **Saúde e fitness**
5. Classificação etária: questionário automático
6. Enviar para revisão (1-7 dias)

### App Store Connect (iOS)
1. App Store Connect → Meus apps → Novo
2. Pelo Xcode: Archive → Distribute → App Store Connect
3. Preencher metadados, screenshots por device, política de privacidade
4. Enviar para review (1-3 dias)

## 6) Updates rápidos (sem republicar)

Como o app usa **webview**, qualquer mudança apenas-frontend pode ser deployada via **Lovable Publish** (`multifit.lovable.app`) e os usuários veem na hora — **se** você manter o `server.url` apontando para esse domínio em `capacitor.config.json`. Trade-off: precisa de internet. Sem `server.url`, o app roda 100% offline com o bundle do APK.

## 7) Política de privacidade (obrigatória)

Crie uma página `/privacy` no app ou hospede em qualquer URL. Tópicos mínimos:
- Quais dados coletamos (email, perfil, fotos, dados de saúde)
- Para que usamos (gerar treinos, social)
- Que usamos Lovable Cloud (Supabase) como infra
- Como o usuário deleta a conta

## 8) Checklist final antes de subir

- [ ] Ícone do app em todos os tamanhos (`android/app/src/main/res/mipmap-*`)
- [ ] Splash screen customizada
- [ ] Versão bumped em `android/app/build.gradle` (`versionCode` + `versionName`)
- [ ] Build testado em device físico (`npx cap run android`)
- [ ] Política de privacidade pública
- [ ] Capturas de tela em pelo menos 1 device por orientação suportada
- [ ] Conta de teste para review (se tiver login obrigatório)
