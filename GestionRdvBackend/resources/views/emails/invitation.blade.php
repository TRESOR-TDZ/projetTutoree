@component('mail::message')

<img src="{{ url('Application/logo/logo1.png') }}" alt="Logo de la plateforme" style="height: 80px; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">

# Invitation

Vous avez été invité à rejoindre la plateforme {{ config('app.name') }} en tant que @isset($role){{ $role }}@endisset de la structure @isset($structureNom){{ $structureNom }}@endisset.

Cliquez sur le bouton ci-dessous pour finaliser votre inscription.

@component('mail::button', ['url' => $url])
Accepter l'invitation
@endcomponent

Si vous ne vous attendiez pas à cette invitation, ignorez ce message.

@endcomponent




