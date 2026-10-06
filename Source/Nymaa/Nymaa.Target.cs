using UnrealBuildTool;

public class NymaaTarget : TargetRules
{
    public NymaaTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        ExtraModuleNames.Add("Nymaa");
    }
}
