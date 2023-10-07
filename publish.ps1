$dist = './dist';
if(Test-Path -LiteralPath $dist){
    Remove-Item -LiteralPath $dist -Recurse
}

&poetry.exe build