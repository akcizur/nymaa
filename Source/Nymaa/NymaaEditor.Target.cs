using UnrealBuildTool;

public class NymaaEditorTarget : TargetRules
{
    public NymaaEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        ExtraModuleNames.Add("Nymaa");
    }
}
