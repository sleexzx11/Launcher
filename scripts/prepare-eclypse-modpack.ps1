param(
    [string]$InstancePath = 'C:\Users\gusta\curseforge\minecraft\Instances\Dragon mine z server'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$launcherConfig = Get-Content -LiteralPath (Join-Path $projectRoot 'extracted_launcher\source\launcher-config.json') -Raw | ConvertFrom-Json
$output = Join-Path $projectRoot 'eclypse-modpack'
$modsOutput = Join-Path $output 'mods'
$instance = Get-Content -LiteralPath (Join-Path $InstancePath 'minecraftinstance.json') -Raw | ConvertFrom-Json
if ($instance.gameVersion -ne '1.20.1' -or -not $instance.baseModLoader.forgeVersion) {
    throw 'A instância deve usar Minecraft 1.20.1 com Forge.'
}
$mods = @(Get-ChildItem -LiteralPath (Join-Path $InstancePath 'mods') -File -Filter '*.jar' | Sort-Object Name)
if ($mods.Count -eq 0) { throw 'Nenhum mod encontrado.' }
New-Item -ItemType Directory -Path $modsOutput -Force | Out-Null
$files = @()
foreach ($mod in $mods) {
    $destination = Join-Path $modsOutput $mod.Name
    Copy-Item -LiteralPath $mod.FullName -Destination $destination -Force
    $sourceHash = (Get-FileHash -LiteralPath $mod.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $copiedHash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($sourceHash -ne $copiedHash) { throw "Falha de integridade: $($mod.Name)" }
    $files += [ordered]@{ path = "mods/$($mod.Name)"; size = $mod.Length; sha256 = $copiedHash }
}
$manifest = [ordered]@{
    name = 'Rede Eclypse'
    minecraftVersion = $instance.gameVersion
    forgeVersion = $instance.baseModLoader.forgeVersion
    javaMajor = 17
    serverAddress = $launcherConfig.serverAddress
    status = 'staging-only'
    files = $files
}
$utf8 = [Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText((Join-Path $output 'modpack-lock.json'), ($manifest | ConvertTo-Json -Depth 10) + "`n", $utf8)
Write-Output "Preparados e verificados $($files.Count) mods em $output"
