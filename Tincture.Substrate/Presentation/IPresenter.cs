namespace Tincture.Substrate.Presentation;

public interface IPresenter<in TInput, out TView>
{
    TView Present(TInput input);
}
