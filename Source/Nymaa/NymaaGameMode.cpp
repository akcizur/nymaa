#include "NymaaGameMode.h"

#include "NymaaPlayerPawn.h"
#include "NymaaCarPawn.h"
#include "NymaaPlayerController.h"

#include "Engine/StaticMeshActor.h"
#include "Components/StaticMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Kismet/GameplayStatics.h"

namespace NymaaBlockout
{
    constexpr float CM = 100.0f;
    constexpr float WorldSize = 100.0f * CM;

    struct FBuildingType
    {
        FVector Size;
        FLinearColor Color;
    };

    static FBuildingType GetType(const FString& Type)
    {
        if (Type == TEXT("HOUSE"))     return { FVector(10, 10, 4) * CM,  FLinearColor(0.72f, 0.48f, 0.32f) };
        if (Type == TEXT("OFFICE"))    return { FVector(12, 12, 12) * CM, FLinearColor(0.46f, 0.51f, 0.60f) };
        if (Type == TEXT("SHOP"))      return { FVector(14, 10, 5) * CM,  FLinearColor(0.79f, 0.63f, 0.29f) };
        if (Type == TEXT("WAREHOUSE")) return { FVector(20, 14, 6) * CM,  FLinearColor(0.54f, 0.59f, 0.65f) };
        return { FVector(16, 16, 20) * CM, FLinearColor(0.37f, 0.42f, 0.48f) };
    }
}

ANymaaGameMode::ANymaaGameMode()
{
    DefaultPawnClass = ANymaaPlayerPawn::StaticClass();
    PlayerControllerClass = ANymaaPlayerController::StaticClass();
}

void ANymaaGameMode::StartPlay()
{
    Super::StartPlay();

    BuildCity();

    PlayerPawn = Cast<ANymaaPlayerPawn>(UGameplayStatics::GetPlayerPawn(this, 0));

    if (PlayerPawn)
    {
        PlayerPawn->SetActorLocation(FVector(0, -2000, 100));
    }

    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;

    CarPawn = GetWorld()->SpawnActor<ANymaaCarPawn>(
        ANymaaCarPawn::StaticClass(),
        FVector(600, -2000, 100),
        FRotator::ZeroRotator,
        Params
    );

    if (ANymaaPlayerController* PC = Cast<ANymaaPlayerController>(UGameplayStatics::GetPlayerController(this, 0)))
    {
        PC->InitializeNymaa(PlayerPawn, CarPawn);
    }
}

void ANymaaGameMode::BuildCity()
{
    SpawnBlock(
        FVector(NymaaBlockout::WorldSize, NymaaBlockout::WorldSize, 20),
        FVector(0, 0, -10),
        FLinearColor(0.22f, 0.28f, 0.24f),
        true
    );

    const FLinearColor RoadColor(0.11f, 0.125f, 0.15f);

    SpawnRoad(FVector(NymaaBlockout::WorldSize, 10 * NymaaBlockout::CM, 20), FVector(0, -2000, 10));
    SpawnRoad(FVector(NymaaBlockout::WorldSize, 10 * NymaaBlockout::CM, 20), FVector(0, 2000, 12));
    SpawnRoad(FVector(10 * NymaaBlockout::CM, NymaaBlockout::WorldSize, 20), FVector(-2500, 0, 14));
    SpawnRoad(FVector(10 * NymaaBlockout::CM, NymaaBlockout::WorldSize, 20), FVector(2500, 0, 16));

    struct FLayoutEntry { const TCHAR* Type; float X; float Y; };

    const FLayoutEntry Layout[] =
    {
        { TEXT("OFFICE"), -10, -6 },
        { TEXT("SHOP"), 8, -8 },
        { TEXT("HOUSE"), -12, 8 },
        { TEXT("OFFICE"), 10, 8 },
        { TEXT("HOUSE"), -38, -35 },
        { TEXT("WAREHOUSE"), 0, -35 },
        { TEXT("SHOP"), 37, -35 },
        { TEXT("OFFICE"), -38, 35 },
        { TEXT("BLOCK"), -8, 35 },
        { TEXT("SHOP"), 10, 35 },
        { TEXT("HOUSE"), 37, 35 },
        { TEXT("HOUSE"), -37, 0 },
        { TEXT("OFFICE"), 37, 0 }
    };

    for (const FLayoutEntry& Entry : Layout)
    {
        SpawnBuilding(Entry.Type, FVector(Entry.X * NymaaBlockout::CM, Entry.Y * NymaaBlockout::CM, 0));
    }
}

void ANymaaGameMode::SpawnRoad(const FVector& Size, const FVector& Location)
{
    SpawnBlock(Size, Location, FLinearColor(0.11f, 0.125f, 0.15f), false);
}

void ANymaaGameMode::SpawnBuilding(const FString& Type, const FVector& Location)
{
    const NymaaBlockout::FBuildingType Data = NymaaBlockout::GetType(Type);
    const FVector Center = Location + FVector(0, 0, Data.Size.Z * 0.5f);

    SpawnBlock(Data.Size, Center, Data.Color, true);
}

AActor* ANymaaGameMode::SpawnBlock(
    const FVector& Size,
    const FVector& Location,
    const FLinearColor& Color,
    bool bCollision)
{
    UWorld* World = GetWorld();
    if (!World)
    {
        return nullptr;
    }

    AStaticMeshActor* Actor = World->SpawnActor<AStaticMeshActor>(Location, FRotator::ZeroRotator);
    if (!Actor)
    {
        return nullptr;
    }

    UStaticMeshComponent* Mesh = Actor->GetStaticMeshComponent();
    if (!Mesh)
    {
        return Actor;
    }

    if (UStaticMesh* CubeMesh = LoadObject<UStaticMesh>(
        nullptr,
        TEXT("/Engine/BasicShapes/Cube.Cube")))
    {
        Mesh->SetStaticMesh(CubeMesh);
    }

    Mesh->SetWorldScale3D(Size / FVector(100.0f, 100.0f, 100.0f));
    Mesh->SetCollisionEnabled(bCollision ? ECollisionEnabled::QueryAndPhysics : ECollisionEnabled::NoCollision);
    Mesh->SetCollisionProfileName(bCollision ? TEXT("BlockAll") : TEXT("NoCollision"));

    if (UMaterialInterface* BaseMaterial = LoadObject<UMaterialInterface>(
        nullptr,
        TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial")))
    {
        if (UMaterialInstanceDynamic* MID = UMaterialInstanceDynamic::Create(BaseMaterial, Actor))
        {
            MID->SetVectorParameterValue(TEXT("Color"), FLinearColor(Color.R, Color.G, Color.B, 1.0f));
            Mesh->SetMaterial(0, MID);
        }
    }

    return Actor;
}
