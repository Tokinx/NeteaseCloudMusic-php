<?php
    error_reporting(0);
    require 'Meting.php';
    use Metowolf\Meting;
    $netease = new Meting('netease');
    $netease->format(true);
    
    if(!empty($_GET['id'])){
        header('Content-Type: application/json;charset=UTF-8');
        
        $name = $_GET['id'] . ".json";
        $save = "cache/" . $name;
        if (file_exists($save)) {
            $fo = fopen($save, "r+");
            $ti = filemtime($save);
            if(date("Ymd", $ti) != date("Ymd")){
                $play_list = $netease->playlist($_GET['id']);
                unlink($uri);
                $str = str_replace("http:\/\/","https:\/\/", $play_list);
                // $str = str_replace("http://m","https://p", $str);
                fwrite($fo, $str);
                echo $str;
            } else {
                echo fread($fo, filesize($save));
            }
        } else {
            $play_list = $netease->playlist($_GET['id']);
            $str = str_replace("http:\/\/","https:\/\/", $play_list);
            // $str = str_replace("http://m","https://p", $str);
            $fo = fopen($save, "w+");
            fwrite($fo, $str);
            echo $str;
        }
        fclose($fo);
    } else if(!empty($_GET['song'])){
        header('Content-Type: application/json;charset=UTF-8');
        
        $str = $netease->url($_GET['song'], 128);
        echo str_replace("http:\/\/","https:\/\/", $str);
    } else if(!empty($_GET['pic'])){
        header('Content-Type: application/json;charset=UTF-8');
        $str = $netease->pic($_GET['pic']);
        echo $str;
    } else if(!empty($_GET['lrc'])){
        header('Content-Type: text/plain;charset=UTF-8');
        
        $name = $_GET['lrc'] . ".lrc";
        $save = "cache/lrc/" . $name;
        if (!file_exists($save)) {
            $lrc = $netease->lyric($_GET['lrc']);
            $str = json_decode($lrc,true);
            if(!empty($str['lyric'])){
                $fo = fopen($save, "w");
                fwrite($fo, $str['lyric']);
                echo $str['lyric'];
            }
        } else {
            $fo = fopen($save, "r");
            echo fread($fo, filesize($save));
        }
        fclose($fo);
    } else {
        // echo "false!";
        // echo $netease->playlist('4525643');
    }
