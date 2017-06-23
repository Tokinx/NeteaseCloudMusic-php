<?php
    require 'lib/Meting.php';
    use Metowolf\Meting;
    $netease = new Meting('netease');
    
    if(!empty($_GET['id'])){
        header('Content-Type: application/json;charset=UTF-8');
        
        $play_list = $netease->playlist($_GET['id']);
        
        $name = $_GET['id'] . ".json";
        $save = "cache/" . $name;
        if (file_exists($save)) {
            $fo = fopen($save, "r+");
            $ti = filemtime($save);
            if(date("Ymd", $ti) != date("Ymd")){
                unlink($uri);
                $str = str_replace("http://p","https://p", $play_list);
                // $str = str_replace("http://m","https://p", $str);
                fwrite($fo, $str);
                echo $str;
            } else {
                echo fread($fo, filesize($save));
            }
        } else {
            $str = str_replace("http://p","https://p", $play_list);
            // $str = str_replace("http://m","https://p", $str);
            $fo = fopen($save, "w+");
            fwrite($fo, $str);
            echo $str;
        }
        fclose($fo);
    } else if(!empty($_GET['song'])){
        header('Content-Type: application/json;charset=UTF-8');
        
        $str = $netease->url($_GET['song'], 128);
        
        $str = str_replace("http://m","https://m", $str);
        echo $str;
    } else if(!empty($_GET['lrc'])){
        header('Content-Type: text/plain;charset=UTF-8');
        
        $lrc = $netease->lyric($_GET['lrc']);
        
        $name = $_GET['lrc'] . ".lrc";
        $save = "cache/lrc/" . $name;
        if (!file_exists($save)) {
            $str = json_decode($lrc,true);
            if(!empty($str['lrc']['lyric'])){
                $fo = fopen($save, "w");
                fwrite($fo, $str['lrc']['lyric']);
                echo $str['lrc']['lyric'];
            }
        } else {
            $fo = fopen($save, "r");
            echo fread($fo, filesize($save));
        }
        fclose($fo);
    } else {
        echo "false!";
    }
