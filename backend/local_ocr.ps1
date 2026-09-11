param([string]$ImagePath)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' }
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null

$op1 = [Windows.Storage.StorageFile]::GetFileFromPathAsync($ImagePath)
$t1 = $asTaskGeneric[0].MakeGenericMethod([Windows.Storage.StorageFile]).Invoke($null, @($op1))
$t1.Wait()
$file = $t1.Result

$op2 = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
$t2 = $asTaskGeneric[0].MakeGenericMethod([Windows.Storage.Streams.IRandomAccessStream]).Invoke($null, @($op2))
$t2.Wait()
$stream = $t2.Result

$op3 = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
$t3 = $asTaskGeneric[0].MakeGenericMethod([Windows.Graphics.Imaging.BitmapDecoder]).Invoke($null, @($op3))
$t3.Wait()
$decoder = $t3.Result

$op4 = $decoder.GetSoftwareBitmapAsync()
$t4 = $asTaskGeneric[0].MakeGenericMethod([Windows.Graphics.Imaging.SoftwareBitmap]).Invoke($null, @($op4))
$t4.Wait()
$bitmap = $t4.Result

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$op5 = $engine.RecognizeAsync($bitmap)
$t5 = $asTaskGeneric[0].MakeGenericMethod([Windows.Media.Ocr.OcrResult]).Invoke($null, @($op5))
$t5.Wait()
$result = $t5.Result
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$result.Text
